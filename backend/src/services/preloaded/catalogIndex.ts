import type { PreloadedCatalogEntry } from "./types.js";

/**
 * Learn no longer seeds mirrored official PDFs or portal links. Generated
 * starter-pack pages (and news briefs) are the catalog students see.
 */
export const ALL_PRELOADED_CATALOG: PreloadedCatalogEntry[] = [];

export function catalogForGoal(goal: PreloadedCatalogEntry["studyGoal"]) {
  return ALL_PRELOADED_CATALOG.filter((e) => e.studyGoal === goal);
}
