import { StudyGoal } from "@prisma/client";
import prisma from "../utils/prisma.js";
import { getFromS3 } from "./s3.js";
import { htmlToPlainText } from "../utils/htmlText.js";
import { logger, errorFields } from "../utils/logger.js";
import { extractPageBody } from "./libraryIndex.js";
import { retrievePageAskContext } from "./ragRetrieve.js";
import {
  joinPackedContext,
  packPageAskContext,
  isThinPageText,
} from "../utils/pageAskContext.js";
import { rewriteSearchQuery } from "../utils/queryRewrite.js";
import { chatHistoryWindow } from "../utils/quotas.js";
import type { ChatContentPart, ChatMessage } from "./llm.js";
import { listVectorsForPage } from "./vectorStore.js";
import { splitIntoSections } from "./mapReduceSummary.js";
import {
  assertDepthAllowed,
  parseStudyDepth,
  shouldMapReduce,
  mayPrepareMapReduce,
  studyDepthConfig,
  type StudyDepth,
} from "./studyDepth.js";
import { promptForMode } from "./pageAskPrompts.js";
import {
  pageAskRetrieveOpts,
  shouldRetrievePageVectors,
} from "./pageAskVectors.js";

const MODES = [
  "ask",
  "summarize",
  "notes",
  "mindmap",
  "deep-summary",
  "analyze",
] as const;
export type PageAskMode = (typeof MODES)[number];

export type PageAskHistoryTurn = {
  role?: string;
  content?: string;
  imageBase64?: string;
};

export type PageAskInput = {
  userId: string;
  articleId?: string;
  userTopicId?: string;
  question?: string;
  /** Expanded slash-command prompt (separate from bubble label). */
  prompt?: string;
  selection?: string;
  mode?: string;
  depth?: string;
  imageBase64?: string;
  history?: PageAskHistoryTurn[];
  /** Reader toggle: allow Google / public web tools (default false). */
  webSearch?: boolean;
};

export function resolvePageAskQuestion(input: PageAskInput): string {
  const prompt = String(input.prompt ?? "").trim();
  const question = String(input.question ?? "").trim();
  return prompt || question;
}

export type PreparedPageAsk = {
  resolvedMode: PageAskMode;
  title: string;
  hasSelection: boolean;
  needVectors: boolean;
  packedChars: number;
  /** Tools enabled for free-form ask (not summarize/notes/mindmap). */
  toolsEnabled: boolean;
  /** web_search + fetch_url available for this ask (reader toggle). */
  webSearchEnabled: boolean;
  /** Open page id for quiz/default scope (personal library only). */
  defaultPageId: string | null;
  chatMessages: ChatMessage[];
  user: {
    name: string | null;
    studyGoal: StudyGoal;
    plan: string;
    role: string;
    subscriptionExpiresAt: Date | null;
    llmTokensUsed: number;
    llmTokensResetAt: Date | null;
  };
  estimatePrompt: string;
  depth: StudyDepth;
  depthConfig: ReturnType<typeof studyDepthConfig>;
  useMapReduce: boolean;
  mapReduceSections: string[];
  mergeInstruction: string;
  systemPrompt: string;
};

export function resolvePageAskMode(mode?: string): PageAskMode {
  return MODES.includes(mode as PageAskMode) ? (mode as PageAskMode) : "ask";
}

export class PageAskPrepareError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "PageAskPrepareError";
  }
}

export async function preparePageAsk(
  input: PageAskInput,
  onStatus?: (stage: string, detail?: string) => void
): Promise<PreparedPageAsk> {
  const resolvedMode = resolvePageAskMode(input.mode);
  const expandedPrompt = String(input.prompt ?? "").trim();
  const depth = parseStudyDepth(input.depth);
  const userQuestion = resolvePageAskQuestion(input);
  const hasSelection = Boolean(input.selection?.trim());
  const userId = input.userId;

  if (!input.articleId && !input.userTopicId) {
    throw new PageAskPrepareError(400, "articleId or userTopicId required");
  }
  if (resolvedMode === "ask" && !userQuestion && !input.imageBase64?.startsWith("data:image/")) {
    throw new PageAskPrepareError(400, "question required");
  }

  onStatus?.("loading_page", "Reading document");

  let title = "";
  let pageBody = "";
  let pageIdForVectors: string | null = null;

  if (input.userTopicId) {
    const topic = await prisma.userTopic.findFirst({
      where: { id: input.userTopicId, userId },
      select: {
        id: true,
        title: true,
        contentUrl: true,
        contentType: true,
        sourceUrl: true,
        pdfKey: true,
        status: true,
      },
    });
    if (!topic || topic.status !== "PUBLISHED") {
      throw new PageAskPrepareError(404, "Page not found");
    }
    title = topic.title;
    pageIdForVectors = topic.id;
    try {
      pageBody = await extractPageBody(topic);
    } catch (err) {
      logger.error("study.user_content.fetch_failed", errorFields(err));
    }
  } else {
    const article = await prisma.article.findUnique({
      where: { id: input.articleId },
      select: { id: true, title: true, contentUrl: true, status: true },
    });
    if (!article || article.status !== "PUBLISHED") {
      throw new PageAskPrepareError(404, "Article not found");
    }
    title = article.title;
    if (article.contentUrl) {
      try {
        const html = await getFromS3(article.contentUrl);
        pageBody = htmlToPlainText(html);
      } catch (err) {
        logger.error("study.content.fetch_failed", errorFields(err));
      }
    }
  }

  const fullFileText = isThinPageText(title, pageBody) ? "" : pageBody.trim();
  const thinText = isThinPageText(title, pageBody);

  const rewrittenQuestion = rewriteSearchQuery(
    userQuestion,
    (input.history ?? [])
      .filter((h) => h.role === "user" || h.role === "assistant")
      .map((h) => ({
        role: h.role as string,
        content: String(h.content ?? ""),
      }))
  );
  const retrievalQuery = [
    rewrittenQuestion,
    input.selection?.trim() ?? "",
    resolvedMode !== "ask" ? `${resolvedMode} ${title}` : "",
    title,
    thinText ? "" : fullFileText.slice(0, 400),
  ]
    .filter(Boolean)
    .join("\n")
    .slice(0, 1200);

  let pageChunks: string[] = [];
  let related: Array<{
    title: string;
    notebook: string;
    topic: string;
    text: string;
  }> = [];

  const forceVectors = process.env.PAGE_ASK_ALWAYS_VECTORS === "true";
  const mapReduceEligibleEarly = mayPrepareMapReduce({
    depth,
    mode: resolvedMode,
    materialChars: fullFileText.length,
    hasSelection,
  });
  const needVectors = shouldRetrievePageVectors({
    pageId: pageIdForVectors,
    forceVectors,
    depth,
    hasSelection,
    thinText,
    fullFileText,
    resolvedMode,
    mapReduceEligible: mapReduceEligibleEarly,
  });

  if (needVectors && pageIdForVectors) {
    onStatus?.("retrieving", "Exploring your library");
    try {
      const retrieved = await retrievePageAskContext(
        userId,
        pageIdForVectors,
        retrievalQuery,
        pageAskRetrieveOpts({
          depth,
          hasSelection,
          resolvedMode,
          userQuestion,
          expandedPrompt: expandedPrompt.length > 0,
        })
      );
      pageChunks = retrieved.pageChunks;
      related = retrieved.relatedExcerpts.map((e) => ({
        title: e.title,
        notebook: e.notebook,
        topic: e.topic,
        text: e.text,
      }));
    } catch (err) {
      logger.error("study.page_vector_retrieve_failed", errorFields(err));
    }
  }

  const packed = packPageAskContext({
    selection: input.selection?.trim(),
    fullFileText,
    pageChunks,
    related,
    budget: studyDepthConfig(depth).pageContextBudget,
  });
  const packedMaterial = joinPackedContext(packed);

  if (!packedMaterial && !input.imageBase64) {
    throw new PageAskPrepareError(
      400,
      "This file has no readable text yet. Wait for processing to finish, or stay on a PDF page so Study AI can use the page image."
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      studyGoal: true,
      plan: true,
      role: true,
      subscriptionExpiresAt: true,
      llmTokensUsed: true,
      llmTokensResetAt: true,
    },
  });
  if (!user) {
    throw new PageAskPrepareError(404, "User not found");
  }

  assertDepthAllowed(user, depth);
  const depthConfig = studyDepthConfig(depth);

  const toolsEnabled = resolvedMode === "ask" && !expandedPrompt;
  const webSearchEnabled = toolsEnabled && input.webSearch === true;

  const messages = promptForMode(
    resolvedMode,
    user.studyGoal ?? "GENERAL",
    user.name,
    title,
    packedMaterial,
    userQuestion,
    hasSelection,
    toolsEnabled,
    webSearchEnabled,
    depth
  );

  const historyWindow = chatHistoryWindow(user);
  const priorCap = Math.min(historyWindow, hasSelection ? 4 : 6);
  const prior: ChatMessage[] = (input.history ?? [])
    .filter(
      (m) =>
        (m.role === "user" || m.role === "assistant") &&
        String(m.content ?? "").trim()
    )
    .slice(-priorCap)
    .map((m) => {
      const role = m.role as "user" | "assistant";
      let text = String(m.content).trim();
      if (role === "assistant" && text.length > 800) {
        text = `${text.slice(0, 800)}…`;
      }
      if (role === "user" && m.imageBase64?.startsWith("data:image/")) {
        const parts: ChatContentPart[] = [
          { type: "text", text },
          { type: "image_url", image_url: { url: m.imageBase64 } },
        ];
        return { role, content: parts };
      }
      return { role, content: text };
    });

  const userContent: ChatContentPart[] = [
    { type: "text", text: messages.user },
  ];
  if (input.imageBase64?.startsWith("data:image/")) {
    userContent.push({
      type: "image_url",
      image_url: { url: input.imageBase64 },
    });
  }

  const chatMessages: ChatMessage[] = [
    { role: "system", content: messages.system },
    ...prior,
    {
      role: "user",
      content: userContent.length > 1 ? userContent : messages.user,
    },
  ];

  const materialChars = Math.max(fullFileText.length, packed.charsUsed);
  const mapReduceEligible = mayPrepareMapReduce({
    depth,
    mode: resolvedMode,
    materialChars,
    hasSelection,
  });

  let mapReduceSections: string[] = [];
  if (mapReduceEligible && pageIdForVectors) {
    try {
      const listed = await listVectorsForPage(userId, pageIdForVectors, 120);
      mapReduceSections = listed
        .map((h) => h.payload.text.trim())
        .filter(Boolean);
    } catch (err) {
      logger.error("study.map_reduce.list_vectors_failed", errorFields(err));
    }
  }
  if (mapReduceEligible && mapReduceSections.length === 0 && fullFileText.length > 8_000) {
    mapReduceSections = splitIntoSections(fullFileText);
  }

  const useMapReduce =
    mapReduceEligible &&
    shouldMapReduce({
      depth,
      mode: resolvedMode,
      materialChars,
      chunkCount: mapReduceSections.length,
    });

  return {
    resolvedMode,
    title,
    hasSelection,
    needVectors,
    packedChars: packed.charsUsed,
    toolsEnabled,
    webSearchEnabled,
    defaultPageId: pageIdForVectors,
    chatMessages,
    user: {
      name: user.name,
      studyGoal: user.studyGoal ?? "GENERAL",
      plan: user.plan,
      role: user.role,
      subscriptionExpiresAt: user.subscriptionExpiresAt,
      llmTokensUsed: user.llmTokensUsed,
      llmTokensResetAt: user.llmTokensResetAt,
    },
    estimatePrompt: messages.system + messages.user,
    depth,
    depthConfig,
    useMapReduce,
    mapReduceSections: useMapReduce ? mapReduceSections : [],
    mergeInstruction: messages.mergeInstruction,
    systemPrompt: messages.system,
  };
}
