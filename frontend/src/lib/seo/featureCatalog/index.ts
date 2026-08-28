import type { ShelfFeature } from "../featureTypes";
import { LIBRARY_FEATURES } from "./libraryFeatures";
import { STUDY_AI_FEATURES } from "./studyAiFeatures";
import { PRACTICE_FEATURES } from "./practiceFeatures";
import { INTEGRATION_FEATURES } from "./integrationFeatures";
import { PLATFORM_FEATURES } from "./platformFeatures";

export const SHELF_FEATURES: ShelfFeature[] = [
  ...LIBRARY_FEATURES,
  ...STUDY_AI_FEATURES,
  ...PRACTICE_FEATURES,
  ...INTEGRATION_FEATURES,
  ...PLATFORM_FEATURES,
];

export function getFeatureBySlug(slug: string): ShelfFeature | undefined {
  return SHELF_FEATURES.find((f) => f.slug === slug);
}

export function getAllFeatureSlugs(): string[] {
  return SHELF_FEATURES.map((f) => f.slug);
}

export function getFeaturesByCategory(
  category: ShelfFeature["category"]
): ShelfFeature[] {
  return SHELF_FEATURES.filter((f) => f.category === category);
}

export function featurePagePath(feature: ShelfFeature): string {
  return feature.canonicalPath ?? `/features/${feature.slug}`;
}
