import { StudyGoal } from "@prisma/client";
import prisma from "../utils/prisma.js";
import { slugify } from "../utils/slugify.js";
import { isStudyGoal } from "../studyGoal.js";

export type BulkImportRow = {
  studyGoal: StudyGoal;
  subjectName: string;
  topicName: string;
  articleTitle: string;
  subjectDescription?: string;
  subjectIcon?: string;
  articleSlug?: string;
  publish?: boolean;
};

export type BulkImportResult = {
  subjectsCreated: number;
  topicsCreated: number;
  articlesCreated: number;
  articlesUpdated: number;
  errors: Array<{ line: number; message: string }>;
};

const CSV_HEADERS = [
  "studyGoal",
  "subjectName",
  "topicName",
  "articleTitle",
  "subjectIcon",
  "subjectDescription",
  "articleSlug",
  "publish",
] as const;

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      out.push(cur.trim());
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur.trim());
  return out;
}

export function parseBulkImportCsv(text: string): {
  rows: BulkImportRow[];
  errors: Array<{ line: number; message: string }>;
} {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { rows: [], errors: [{ line: 1, message: "CSV is empty" }] };
  }

  const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const required = ["studygoal", "subjectname", "topicname", "articletitle"];
  for (const key of required) {
    if (!header.includes(key)) {
      return {
        rows: [],
        errors: [{ line: 1, message: `Missing required column: ${key}` }],
      };
    }
  }

  const idx = (name: string) => header.indexOf(name);
  const rows: BulkImportRow[] = [];
  const errors: Array<{ line: number; message: string }> = [];

  for (let i = 1; i < lines.length; i++) {
    const lineNo = i + 1;
    const cols = parseCsvLine(lines[i]);
    const get = (name: string) => cols[idx(name)] ?? "";

    const studyGoalRaw = get("studygoal").toUpperCase();
    if (!isStudyGoal(studyGoalRaw)) {
      errors.push({ line: lineNo, message: `Invalid studyGoal: ${studyGoalRaw}` });
      continue;
    }

    const subjectName = get("subjectname");
    const topicName = get("topicname");
    const articleTitle = get("articletitle");
    if (!subjectName || !topicName || !articleTitle) {
      errors.push({
        line: lineNo,
        message: "subjectName, topicName, and articleTitle are required",
      });
      continue;
    }

    const publishRaw = get("publish").toLowerCase();
    rows.push({
      studyGoal: studyGoalRaw,
      subjectName,
      topicName,
      articleTitle,
      subjectDescription: get("subjectdescription") || undefined,
      subjectIcon: get("subjecticon") || undefined,
      articleSlug: get("articleslug") || undefined,
      publish: publishRaw === "true" || publishRaw === "1" || publishRaw === "yes",
    });
  }

  return { rows, errors };
}

async function upsertSubject(row: BulkImportRow) {
  const slug = slugify(row.subjectName);
  if (!slug) throw new Error("Invalid subject name");

  const existing = await prisma.subject.findUnique({ where: { slug } });
  if (existing) {
    return prisma.subject.update({
      where: { id: existing.id },
      data: {
        studyGoal: row.studyGoal,
        ...(row.subjectDescription
          ? { description: row.subjectDescription }
          : {}),
        ...(row.subjectIcon ? { icon: row.subjectIcon } : {}),
      },
    });
  }

  return prisma.subject.create({
    data: {
      name: row.subjectName,
      slug,
      studyGoal: row.studyGoal,
      description: row.subjectDescription,
      icon: row.subjectIcon ?? "📚",
      order: (await prisma.subject.count()) + 1,
    },
  });
}

async function upsertTopic(subjectId: string, topicName: string) {
  const slug = slugify(topicName);
  if (!slug) throw new Error("Invalid topic name");

  return prisma.topic.upsert({
    where: { subjectId_slug: { subjectId, slug } },
    update: { title: topicName },
    create: {
      subjectId,
      title: topicName,
      slug,
      order: (await prisma.topic.count({ where: { subjectId } })) + 1,
    },
  });
}

export async function applyBulkImportManifest(
  rows: BulkImportRow[]
): Promise<BulkImportResult> {
  const result: BulkImportResult = {
    subjectsCreated: 0,
    topicsCreated: 0,
    articlesCreated: 0,
    articlesUpdated: 0,
    errors: [],
  };

  const subjectCache = new Map<string, string>();
  const topicCache = new Map<string, string>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const line = i + 2;
    try {
      const subjectKey = `${row.studyGoal}::${row.subjectName}`;
      let subjectId = subjectCache.get(subjectKey);
      if (!subjectId) {
        const before = await prisma.subject.findUnique({
          where: { slug: slugify(row.subjectName) },
        });
        const subject = await upsertSubject(row);
        subjectId = subject.id;
        subjectCache.set(subjectKey, subjectId);
        if (!before) result.subjectsCreated++;
      }

      const topicKey = `${subjectId}::${row.topicName}`;
      let topicId = topicCache.get(topicKey);
      if (!topicId) {
        const topicSlug = slugify(row.topicName);
        const before = topicSlug
          ? await prisma.topic.findUnique({
              where: {
                subjectId_slug: { subjectId, slug: topicSlug },
              },
            })
          : null;
        const topic = await upsertTopic(subjectId, row.topicName);
        topicId = topic.id;
        topicCache.set(topicKey, topicId);
        if (!before) result.topicsCreated++;
      }

      const articleSlug = slugify(row.articleSlug || row.articleTitle);
      if (!articleSlug) throw new Error("Invalid article title");

      const existing = await prisma.article.findUnique({
        where: { topicId_slug: { topicId, slug: articleSlug } },
      });

      if (existing) {
        await prisma.article.update({
          where: { id: existing.id },
          data: {
            title: row.articleTitle,
            ...(row.publish ? { status: "DRAFT" } : {}),
          },
        });
        result.articlesUpdated++;
      } else {
        await prisma.article.create({
          data: {
            topicId,
            title: row.articleTitle,
            slug: articleSlug,
            status: row.publish ? "DRAFT" : "DRAFT",
            order:
              (await prisma.article.count({ where: { topicId } })) + 1,
          },
        });
        result.articlesCreated++;
      }
    } catch (err) {
      result.errors.push({
        line,
        message: err instanceof Error ? err.message : "Row failed",
      });
    }
  }

  return result;
}

export function bulkImportCsvTemplate(): string {
  return [
    CSV_HEADERS.join(","),
    'UPSC,Polity,Fundamental Rights,Article 14-18 Equality,📚,Constitutional law,,false',
    'UPSC,Polity,Fundamental Rights,Article 19 Freedoms,📚,Constitutional law,,false',
    'GATE,Algorithms,Sorting,Merge sort notes,📐,CS curriculum,,false',
  ].join("\n");
}
