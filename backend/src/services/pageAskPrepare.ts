import { StudyGoal } from "@prisma/client";
import prisma from "../utils/prisma.js";
import { getFromS3 } from "./s3.js";
import { htmlToPlainText } from "../utils/htmlText.js";
import { logger, errorFields } from "../utils/logger.js";
import { extractPageBody } from "./libraryIndex.js";
import { retrievePageAskContext } from "./ragRetrieve.js";
import { pageAskSystemPrompt } from "./goalPrompt.js";
import {
  joinPackedContext,
  packPageAskContext,
  isThinPageText,
} from "../utils/pageAskContext.js";
import { rewriteSearchQuery } from "../utils/queryRewrite.js";
import { chatHistoryWindow } from "../utils/quotas.js";
import type { ChatContentPart, ChatMessage } from "./llm.js";

const MODES = ["ask", "summarize", "notes", "mindmap"] as const;
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
  selection?: string;
  mode?: string;
  imageBase64?: string;
  history?: PageAskHistoryTurn[];
};

export type PreparedPageAsk = {
  resolvedMode: PageAskMode;
  title: string;
  hasSelection: boolean;
  needVectors: boolean;
  packedChars: number;
  /** Tools enabled for free-form ask (not summarize/notes/mindmap). */
  toolsEnabled: boolean;
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
};

function promptForMode(
  mode: PageAskMode,
  studyGoal: StudyGoal,
  learnerName: string | null | undefined,
  articleTitle: string,
  packedMaterial: string,
  question: string | undefined,
  hasSelection: boolean,
  withTools: boolean
): { system: string; user: string } {
  const system = pageAskSystemPrompt(studyGoal, { name: learnerName }, { withTools });

  const scopeNote = hasSelection
    ? "Highlight is the primary focus. Still use the file passages and related library notes for full-document and persona context."
    : "No highlight — answer from the full file when the question is about this document. Retrieved passages cover the whole PDF when text was indexed. If a page image is attached, that is the page the learner is viewing (use it for scanned / image-only files).";

  const material = packedMaterial.trim()
    ? packedMaterial.trim()
    : "(No extractable text — use the attached PDF page image as the document when the question is about this file.)";

  if (mode === "summarize") {
    return {
      system,
      user: `Summarize this file for revision. Use ## Summary then ### Key points and ### Recap.\n${scopeNote}\nTitle: ${articleTitle}\n\n${material}`,
    };
  }
  if (mode === "notes") {
    return {
      system,
      user: `Create short revision notes. Use ## Notes, then ### Key terms and ### Must remember.\n${scopeNote}\nTitle: ${articleTitle}\n\n${material}`,
    };
  }
  if (mode === "mindmap") {
    return {
      system,
      user: `Create a Mermaid mind map for this material.
${scopeNote}
Title: ${articleTitle}

Output format (strict):
1. A short ## Mind map heading.
2. Then a single fenced code block tagged mermaid using the mindmap diagram type.
3. Put the central topic in root((…)). Keep 3–7 main branches, each with brief child nodes.
4. Use plain ASCII labels (no quotes, no parentheses inside node text except the root((…)) form).
5. Optional: one short ### Key takeaways bullet list after the diagram.
6. Do not use indented markdown trees instead of Mermaid.

Example shape:
\`\`\`mermaid
mindmap
  root((Topic))
    Branch one
      Detail
    Branch two
\`\`\`

Material:

${material}`,
    };
  }

  return {
    system,
    user: `Question: ${question?.trim() || "Explain this clearly."}
${scopeNote}
If this question is not about the open file, answer generally (and use tools for planner/quiz/app actions when asked). Do not refuse just because the answer is not in the PDF.

File: ${articleTitle}

${material}`,
  };
}

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
  const hasSelection = Boolean(input.selection?.trim());
  const userId = input.userId;

  if (!input.articleId && !input.userTopicId) {
    throw new PageAskPrepareError(400, "articleId or userTopicId required");
  }
  if (resolvedMode === "ask" && !String(input.question ?? "").trim()) {
    if (!input.imageBase64?.startsWith("data:image/")) {
      throw new PageAskPrepareError(400, "question required");
    }
  }

  onStatus?.("loading_page", "Reading this file…");

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
    String(input.question ?? "").trim(),
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
  const needVectors =
    Boolean(pageIdForVectors) &&
    (forceVectors || !hasSelection || thinText || fullFileText.length < 8_000);

  if (needVectors && pageIdForVectors) {
    onStatus?.("retrieving", "Searching your notes…");
    try {
      const retrieved = await retrievePageAskContext(
        userId,
        pageIdForVectors,
        retrievalQuery,
        {
          hasSelection,
          includeRelated: process.env.PAGE_ASK_RELATED === "true",
          coverWholePage: !hasSelection,
          questionFocused:
            resolvedMode === "ask" &&
            Boolean(String(input.question ?? "").trim()),
        }
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

  const messages = promptForMode(
    resolvedMode,
    user.studyGoal ?? "GENERAL",
    user.name,
    title,
    packedMaterial,
    input.question,
    hasSelection,
    resolvedMode === "ask"
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

  return {
    resolvedMode,
    title,
    hasSelection,
    needVectors,
    packedChars: packed.charsUsed,
    toolsEnabled: resolvedMode === "ask",
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
  };
}
