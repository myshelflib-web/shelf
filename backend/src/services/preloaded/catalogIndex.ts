import { PRELOADED_CATALOG_UPSC, PRELOADED_CATALOG_STATE } from "./entriesUpscState.js";
import { PRELOADED_CATALOG_NCERT } from "./entriesNcert.js";
import {
  PRELOADED_CATALOG_CA,
  PRELOADED_CATALOG_GATE,
  PRELOADED_CATALOG_JUDICIARY,
  PRELOADED_CATALOG_NEET,
} from "./entriesOtherGoals.js";
import { PRELOADED_CATALOG_OPEN_TEXTBOOKS } from "./entriesOpenTextbooks.js";
import type { PreloadedCatalogEntry } from "./types.js";

export const ALL_PRELOADED_CATALOG: PreloadedCatalogEntry[] = [
  ...PRELOADED_CATALOG_UPSC,
  ...PRELOADED_CATALOG_STATE,
  ...PRELOADED_CATALOG_NCERT,
  ...PRELOADED_CATALOG_GATE,
  ...PRELOADED_CATALOG_CA,
  ...PRELOADED_CATALOG_NEET,
  ...PRELOADED_CATALOG_JUDICIARY,
  ...PRELOADED_CATALOG_OPEN_TEXTBOOKS,
];

export function catalogForGoal(goal: PreloadedCatalogEntry["studyGoal"]) {
  return ALL_PRELOADED_CATALOG.filter((e) => e.studyGoal === goal);
}
