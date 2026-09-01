import type {
  IngestLicense,
  IngestRefreshCadence,
  IngestSourceKind,
  StudyGoal,
} from "@prisma/client";

export type IngestSourceSeed = {
  name: string;
  slug: string;
  kind: IngestSourceKind;
  feedUrl: string;
  studyGoals: StudyGoal[];
  license: IngestLicense;
  cadence: IngestRefreshCadence;
  maxItemsPerRun?: number;
  promoteToSubjectSlug?: string;
  promoteToTopicSlug?: string;
  config?: Record<string, unknown>;
};

/** Copyright-safe default sources — gov press + official document watchers only. */
export const DEFAULT_INGEST_SOURCES: IngestSourceSeed[] = [
  {
    name: "PIB — Press releases (national)",
    slug: "pib-all-releases",
    kind: "RSS",
    feedUrl: "https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=3",
    studyGoals: ["UPSC", "STATE_PCS"],
    license: "GOVERNMENT_PRESS",
    cadence: "HOURLY",
    maxItemsPerRun: 25,
    promoteToSubjectSlug: "current-affairs",
    promoteToTopicSlug: "daily-digest",
    config: { tags: ["pib", "government"] },
  },
  {
    name: "PRS — Parliament updates",
    slug: "prs-legislative",
    kind: "OFFICIAL_PAGE_WATCH",
    feedUrl: "https://prsindia.org/",
    studyGoals: ["UPSC", "STATE_PCS"],
    license: "LINK_ONLY",
    cadence: "DAILY",
    maxItemsPerRun: 5,
    promoteToSubjectSlug: "current-affairs",
    promoteToTopicSlug: "legislative-updates",
    config: { tags: ["prs", "legislation"] },
  },
  {
    name: "UPSC — Examinations page",
    slug: "upsc-examinations",
    kind: "OFFICIAL_PAGE_WATCH",
    feedUrl: "https://upsc.gov.in/examinations/previous-question-papers",
    studyGoals: ["UPSC"],
    license: "OFFICIAL_DOCUMENT",
    cadence: "WEEKLY",
    maxItemsPerRun: 5,
    promoteToSubjectSlug: "syllabus-exam-pattern",
    promoteToTopicSlug: "notification",
    config: {
      pdfLinkPattern: "\\.pdf",
      editionFromYear: true,
      tags: ["upsc", "syllabus"],
    },
  },
  {
    name: "India Budget — Documents",
    slug: "india-budget-docs",
    kind: "OFFICIAL_PAGE_WATCH",
    feedUrl: "https://www.indiabudget.gov.in/",
    studyGoals: ["UPSC", "STATE_PCS", "CA"],
    license: "OFFICIAL_DOCUMENT",
    cadence: "YEARLY",
    maxItemsPerRun: 8,
    promoteToSubjectSlug: "indian-economy",
    promoteToTopicSlug: "budget-survey",
    config: {
      pdfLinkPattern: "\\.pdf",
      editionFromYear: true,
      tags: ["budget", "economic-survey"],
    },
  },
  {
    name: "ICAI — Announcements",
    slug: "icai-announcements",
    kind: "OFFICIAL_PAGE_WATCH",
    feedUrl: "https://www.icai.org/post.html?post_id=14051",
    studyGoals: ["CA"],
    license: "LINK_ONLY",
    cadence: "WEEKLY",
    maxItemsPerRun: 10,
    promoteToSubjectSlug: "ca-updates",
    promoteToTopicSlug: "announcements",
    config: { tags: ["icai", "ca"] },
  },
  {
    name: "GATE — Official site",
    slug: "gate-official",
    kind: "OFFICIAL_PAGE_WATCH",
    feedUrl: "https://gate2026.iitg.ac.in/",
    studyGoals: ["GATE"],
    license: "LINK_ONLY",
    cadence: "MONTHLY",
    maxItemsPerRun: 5,
    promoteToSubjectSlug: "gate-updates",
    promoteToTopicSlug: "brochure-notification",
    config: { tags: ["gate"] },
  },
  {
    name: "NCERT — Textbooks portal",
    slug: "ncert-textbooks",
    kind: "OFFICIAL_PAGE_WATCH",
    feedUrl: "https://ncert.nic.in/textbook.php",
    studyGoals: ["UPSC", "STATE_PCS", "GATE"],
    license: "OFFICIAL_DOCUMENT",
    cadence: "YEARLY",
    maxItemsPerRun: 5,
    promoteToSubjectSlug: "ncert",
    promoteToTopicSlug: "textbooks",
    config: {
      pdfLinkPattern: "\\.pdf",
      tags: ["ncert"],
    },
  },
];

export const CADENCE_MS: Record<IngestRefreshCadence, number> = {
  HOURLY: 60 * 60 * 1000,
  DAILY: 24 * 60 * 60 * 1000,
  WEEKLY: 7 * 24 * 60 * 60 * 1000,
  MONTHLY: 30 * 24 * 60 * 60 * 1000,
  YEARLY: 365 * 24 * 60 * 60 * 1000,
};
