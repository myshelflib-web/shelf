import { PRELOADED_CATALOG_UPSC, PRELOADED_CATALOG_STATE } from "./entriesUpscState.js";
import { PRELOADED_CATALOG_NCERT } from "./entriesNcert.js";
import {
  PRELOADED_CATALOG_CA,
  PRELOADED_CATALOG_GATE,
  PRELOADED_CATALOG_JUDICIARY,
  PRELOADED_CATALOG_NEET,
} from "./entriesOtherGoals.js";
import { PRELOADED_CATALOG_OPEN_TEXTBOOKS } from "./entriesOpenTextbooks.js";
import { isPdfUrl } from "../curriculumSavePolicy.js";
import type { PreloadedCatalogEntry } from "./types.js";

const RAW_PRELOADED_CATALOG: PreloadedCatalogEntry[] = [
  ...PRELOADED_CATALOG_UPSC,
  ...PRELOADED_CATALOG_STATE,
  ...PRELOADED_CATALOG_NCERT,
  ...PRELOADED_CATALOG_GATE,
  ...PRELOADED_CATALOG_CA,
  ...PRELOADED_CATALOG_NEET,
  ...PRELOADED_CATALOG_JUDICIARY,
  ...PRELOADED_CATALOG_OPEN_TEXTBOOKS,
];

/** Every preloaded subject ever seeded — including retired link-only portals. */
export const PRELOADED_SUBJECT_SLUGS = [
  ...new Set(RAW_PRELOADED_CATALOG.map((e) => e.subjectSlug)),
];

/**
 * Learnable official PDFs only. Homepage / gazette / institute links do not
 * load in the reader, so they are not seeded and are pruned from Learn.
 */
export const ALL_PRELOADED_CATALOG: PreloadedCatalogEntry[] =
  RAW_PRELOADED_CATALOG.filter(
    (e) => e.license === "OFFICIAL_DOCUMENT" && isPdfUrl(e.sourceUrl)
  );

export function catalogForGoal(goal: PreloadedCatalogEntry["studyGoal"]) {
  return ALL_PRELOADED_CATALOG.filter((e) => e.studyGoal === goal);
}
