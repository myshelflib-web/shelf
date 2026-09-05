import prisma from "../../utils/prisma.js";
import { logger, errorFields } from "../../utils/logger.js";
import { listCommonPrefixes, listObjectKeys } from "../s3.js";
import { isSyllabusAdminSubject } from "./slugs.js";
import {
  parseOfficialSyllabusKeys,
  SYLLABUS_S3_PREFIXES,
  type OfficialSyllabusPdf,
} from "./parseKeys.js";

const TTL_MS = 120_000;
const WAIT_MS = 4_000;
let lastAt = 0;
let inflight: Promise<number> | null = null;

const GOAL_ORDER: OfficialSyllabusPdf["studyGoal"][] = [
  "UPSC",
  "STATE_PCS",
  "JUDICIARY",
  "CA",
  "NEET_PG",
  "GATE",
  "GENERAL",
];

async function collectSyllabusKeys(): Promise<string[]> {
  const prefixes = new Set<string>(SYLLABUS_S3_PREFIXES);
  try {
    const adminKids = await listCommonPrefixes("admin/");
    for (const prefix of adminKids) {
      const segment = prefix.replace(/^admin\//, "").replace(/\/$/, "");
      if (isSyllabusAdminSubject(segment)) prefixes.add(prefix);
    }
  } catch (err) {
    logger.warn("officialSyllabus.list_admin_failed", errorFields(err));
  }

  const keys = new Set<string>();
  await Promise.all(
    [...prefixes].map(async (prefix) => {
      try {
        const listed = await listObjectKeys(prefix, { max: 400 });
        for (const key of listed) keys.add(key);
      } catch (err) {
        logger.warn("officialSyllabus.list_prefix_failed", {
          prefix,
          ...errorFields(err),
        });
      }
    })
  );
  return [...keys];
}

async function upsertPdf(entry: OfficialSyllabusPdf, order: number): Promise<void> {
  const subject = await prisma.subject.upsert({
    where: { slug: entry.subjectSlug },
    create: {
      name: entry.subjectName,
      slug: entry.subjectSlug,
      studyGoal: entry.studyGoal,
      description: `Official ${entry.subjectName} syllabus PDFs.`,
      order,
    },
    update: {
      name: entry.subjectName,
      studyGoal: entry.studyGoal,
    },
    select: { id: true },
  });

  const topic = await prisma.topic.upsert({
    where: {
      subjectId_slug: { subjectId: subject.id, slug: entry.topicSlug },
    },
    create: {
      subjectId: subject.id,
      title: entry.topicTitle,
      slug: entry.topicSlug,
      description: entry.topicTitle,
      order: 0,
    },
    update: { title: entry.topicTitle },
    select: { id: true },
  });

  const existing = await prisma.article.findUnique({
    where: { topicId_slug: { topicId: topic.id, slug: entry.articleSlug } },
    select: { id: true, pdfKey: true },
  });

  if (existing) {
    await prisma.article.update({
      where: { id: existing.id },
      data: {
        title: entry.title,
        pdfKey: entry.pdfKey,
        status: "PUBLISHED",
        sourceLicense: "OFFICIAL_DOCUMENT",
      },
    });
    return;
  }

  await prisma.article.create({
    data: {
      topicId: topic.id,
      title: entry.title,
      slug: entry.articleSlug,
      pdfKey: entry.pdfKey,
      status: "PUBLISHED",
      isPremium: false,
      sourceLicense: "OFFICIAL_DOCUMENT",
      summary: `Official ${entry.subjectName} syllabus PDF.`,
      order: 0,
    },
  });
}

export async function syncOfficialSyllabusFromS3(): Promise<number> {
  const keys = await collectSyllabusKeys();
  const entries = parseOfficialSyllabusKeys(keys).sort((a, b) => {
    const goalCmp =
      GOAL_ORDER.indexOf(a.studyGoal) - GOAL_ORDER.indexOf(b.studyGoal);
    if (goalCmp !== 0) return goalCmp;
    return a.title.localeCompare(b.title);
  });

  const subjectOrder = new Map<string, number>();
  for (const entry of entries) {
    if (!subjectOrder.has(entry.subjectSlug)) {
      subjectOrder.set(entry.subjectSlug, subjectOrder.size);
    }
  }

  for (const entry of entries) {
    await upsertPdf(entry, subjectOrder.get(entry.subjectSlug) ?? 0);
  }

  logger.info("officialSyllabus.synced", {
    keys: keys.length,
    pdfs: entries.length,
  });
  return entries.length;
}

/** Discover official exam syllabus PDFs in S3 and publish them in Learn. */
export async function ensureOfficialSyllabusFromS3(): Promise<number> {
  if (Date.now() - lastAt < TTL_MS) return 0;
  if (!inflight) {
    inflight = syncOfficialSyllabusFromS3()
      .catch((err) => {
        logger.warn("officialSyllabus.sync_failed", errorFields(err));
        return 0;
      })
      .finally(() => {
        inflight = null;
        lastAt = Date.now();
      });
  }
  return Promise.race([
    inflight,
    new Promise<number>((resolve) => {
      setTimeout(() => resolve(0), WAIT_MS);
    }),
  ]);
}
