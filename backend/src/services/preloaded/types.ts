import type { IngestLicense, StudyGoal } from "@prisma/client";

export type PreloadedCatalogEntry = {
  subjectSlug: string;
  subjectName: string;
  topicSlug: string;
  topicTitle: string;
  studyGoal: StudyGoal;
  title: string;
  slug: string;
  sourceUrl: string;
  license: IngestLicense;
  summary: string;
  order?: number;
};
