export type FeatureCategoryId =
  | "library"
  | "study-ai"
  | "practice"
  | "integrations"
  | "platform";

export type FeatureCategory = {
  id: FeatureCategoryId;
  label: string;
  description: string;
};

export type ShelfFeature = {
  slug: string;
  category: FeatureCategoryId;
  title: string;
  metaDescription: string;
  keywords: string[];
  headline: string;
  subhead: string;
  bullets: string[];
  paragraphs: string[];
  relatedBlogSlug?: string;
  ctaHref: string;
  ctaLabel: string;
  secondaryCtaHref?: string;
  secondaryCtaLabel?: string;
  /** When set, canonical points here instead of /features/[slug] */
  canonicalPath?: string;
};
