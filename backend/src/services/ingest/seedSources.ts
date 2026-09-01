import type { Prisma } from "@prisma/client";
import prisma from "../../utils/prisma.js";
import { DEFAULT_INGEST_SOURCES } from "./sourceRegistry.js";

export async function seedDefaultIngestSources(): Promise<{ created: number; updated: number }> {
  let created = 0;
  let updated = 0;

  for (const seed of DEFAULT_INGEST_SOURCES) {
    const existing = await prisma.ingestSource.findUnique({ where: { slug: seed.slug } });
    if (existing) {
      await prisma.ingestSource.update({
        where: { slug: seed.slug },
        data: {
          name: seed.name,
          kind: seed.kind,
          feedUrl: seed.feedUrl,
          studyGoals: seed.studyGoals,
          license: seed.license,
          cadence: seed.cadence,
          maxItemsPerRun: seed.maxItemsPerRun ?? 20,
          promoteToSubjectSlug: seed.promoteToSubjectSlug,
          promoteToTopicSlug: seed.promoteToTopicSlug,
          config: (seed.config ?? undefined) as Prisma.InputJsonValue | undefined,
        },
      });
      updated += 1;
    } else {
      await prisma.ingestSource.create({
        data: {
          name: seed.name,
          slug: seed.slug,
          kind: seed.kind,
          feedUrl: seed.feedUrl,
          studyGoals: seed.studyGoals,
          license: seed.license,
          cadence: seed.cadence,
          maxItemsPerRun: seed.maxItemsPerRun ?? 20,
          promoteToSubjectSlug: seed.promoteToSubjectSlug,
          promoteToTopicSlug: seed.promoteToTopicSlug,
          config: (seed.config ?? undefined) as Prisma.InputJsonValue | undefined,
          enabled: true,
        },
      });
      created += 1;
    }
  }

  return { created, updated };
}
