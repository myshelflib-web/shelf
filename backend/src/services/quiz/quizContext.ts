import { StudyGoal } from "@prisma/client";
import prisma from "../../utils/prisma.js";
import { getFromS3 } from "../s3.js";
import { htmlToPlainText, truncateText } from "../../utils/htmlText.js";
import {
  resolveContextPageIds,
  type ChatContextKind,
} from "../../utils/chatContext.js";
import { retrieveLibrary } from "../ragRetrieve.js";
import { retrievePageAskContext } from "../ragRetrieve.js";
import { QUIZ_SOURCE_EXCERPT_MAX, type QuizSourceKind } from "./quizLimits.js";

export type PackedQuizContext = {
  scopeLabel: string;
  excerpt: string;
  syllabusText: string | null;
};

const BANK_TITLE_NEEDLES = [
  "pyq",
  "previous year",
  "past paper",
  "rtp",
  "mtp",
  "question paper",
  "standard question",
  "practice paper",
  "prelims",
  "mains",
];

function packBlocks(blocks: string[], max = QUIZ_SOURCE_EXCERPT_MAX): string {
  let out = "";
  for (const b of blocks) {
    const t = b.trim();
    if (!t) continue;
    if (out.length + t.length + 2 > max) {
      out += `\n${t.slice(0, Math.max(0, max - out.length - 8))}`;
      break;
    }
    out += (out ? "\n\n" : "") + t;
  }
  return out;
}

async function loadSyllabus(
  userId: string,
  relevancyDocId: string | null
): Promise<string | null> {
  if (!relevancyDocId) return null;
  const doc = await prisma.studyRelevancyDoc.findFirst({
    where: { id: relevancyDocId, userId },
    select: { body: true },
  });
  if (!doc?.body.trim()) return null;
  return truncateText(doc.body.trim(), 24_000);
}

async function examBankPageIds(userId: string): Promise<string[] | null> {
  const pages = await prisma.userTopic.findMany({
    where: {
      userId,
      status: "PUBLISHED",
      OR: BANK_TITLE_NEEDLES.map((needle) => ({
        title: { contains: needle, mode: "insensitive" as const },
      })),
    },
    select: { id: true },
    take: 80,
  });
  return pages.length > 0 ? pages.map((p) => p.id) : null;
}

async function packLibraryExcerpts(
  userId: string,
  query: string,
  pageIds: string[] | null,
  extraQueries: string[]
): Promise<string[]> {
  const blocks: string[] = [];
  const queries = [query, ...extraQueries].filter((q) => q.trim());
  const seen = new Set<string>();

  if (pageIds?.length === 1) {
    const { pageChunks, relatedExcerpts } = await retrievePageAskContext(
      userId,
      pageIds[0],
      query,
      { coverWholePage: true, includeRelated: true }
    );
    for (const chunk of pageChunks) {
      const key = chunk.slice(0, 80);
      if (seen.has(key)) continue;
      seen.add(key);
      blocks.push(chunk);
    }
    for (const ex of relatedExcerpts) {
      blocks.push(`[Related] ${ex.title}: ${ex.text}`);
    }
  }

  for (const q of queries.slice(0, 3)) {
    const hits = await retrieveLibrary(userId, q, { pageIds });
    for (const hit of hits) {
      const key = `${hit.pageId}:${hit.text.slice(0, 60)}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const head = [hit.notebook, hit.topic, hit.title].filter(Boolean).join(" · ");
      blocks.push(`[${head}]\n${hit.text}`);
    }
  }
  return blocks;
}

async function packCurriculum(goal: StudyGoal): Promise<string[]> {
  if (goal === "GENERAL") return [];
  const subjects = await prisma.subject.findMany({
    where: { studyGoal: goal },
    orderBy: { order: "asc" },
    take: 4,
    select: {
      name: true,
      topics: {
        orderBy: { order: "asc" },
        take: 4,
        select: {
          title: true,
          articles: {
            where: { status: "PUBLISHED" },
            orderBy: { order: "asc" },
            take: 3,
            select: { title: true, contentUrl: true },
          },
        },
      },
    },
  });
  const blocks: string[] = [];
  for (const subject of subjects) {
    for (const topic of subject.topics) {
      for (const article of topic.articles) {
        let text = article.title;
        if (article.contentUrl) {
          try {
            const html = await getFromS3(article.contentUrl);
            text = truncateText(htmlToPlainText(html), 1800);
          } catch {
            /* title only */
          }
        }
        blocks.push(
          `[Preloaded · ${subject.name} · ${topic.title} · ${article.title}]\n${text}`
        );
        if (blocks.length >= 8) return blocks;
      }
    }
  }
  return blocks;
}

export async function packQuizContext(input: {
  userId: string;
  sourceKind: QuizSourceKind;
  contextKind: string;
  contextNotebookId: string | null;
  contextTopicId: string | null;
  contextPageId: string | null;
  relevancyDocId: string | null;
  focusTopic: string | null;
  uploadText?: string | null;
  studyGoal: StudyGoal;
}): Promise<PackedQuizContext> {
  const syllabusText = await loadSyllabus(input.userId, input.relevancyDocId);
  const focus = input.focusTopic?.trim() || "high-yield exam questions";
  const blocks: string[] = [];
  let scopeLabel = "Entire library";

  if (input.sourceKind === "UPLOAD") {
    const upload = String(input.uploadText ?? "").trim();
    if (upload) {
      blocks.push(`[Uploaded source]\n${truncateText(upload, 36_000)}`);
    }
    scopeLabel = "Uploaded document";
  } else {
    const resolved = await resolveContextPageIds(input.userId, {
      contextKind: input.contextKind as ChatContextKind,
      contextNotebookId: input.contextNotebookId,
      contextTopicId: input.contextTopicId,
      contextPageId: input.contextPageId,
    });
    scopeLabel = resolved.label;
    const pageIds =
      input.sourceKind === "EXAM_BANK" && resolved.kind === "LIBRARY"
        ? await examBankPageIds(input.userId)
        : resolved.pageIds;
    const extra =
      input.sourceKind === "EXAM_BANK"
        ? [
            "previous year question paper PYQ standard questions",
            `${input.studyGoal} exam practice questions`,
          ]
        : [];
    const libraryBlocks = await packLibraryExcerpts(
      input.userId,
      focus,
      pageIds,
      extra
    );
    blocks.push(...libraryBlocks);
    if (input.sourceKind === "EXAM_BANK") {
      blocks.push(...(await packCurriculum(input.studyGoal)));
      if (pageIds === null && libraryBlocks.length === 0) {
        scopeLabel = "Exam bank (preloaded + track syllabus)";
      } else if (pageIds && pageIds.length > 0 && resolved.kind === "LIBRARY") {
        scopeLabel = "Exam bank (PYQ / standard papers in library)";
      }
    }
  }

  if (syllabusText) {
    blocks.unshift(`[Syllabus]\n${truncateText(syllabusText, 8_000)}`);
  }

  const excerpt = packBlocks(blocks);
  return { scopeLabel, excerpt, syllabusText };
}
