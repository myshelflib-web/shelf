export type BlogSectionContent = {
  heading?: string;
  paragraphs: string[];
  bullets?: string[];
  illustrationKey?: string;
};

export type BlogPostContent = {
  sections: BlogSectionContent[];
};

export type BlogPostSummary = {
  slug: string;
  title: string;
  description: string;
  excerpt: string;
  publishedAt: string;
  updatedAt?: string;
  tags: string[];
  readingMinutes: number;
  coverImageUrl?: string;
  heroIllustrationUrl?: string;
};

export type BlogPostPublic = BlogPostSummary & {
  sections: Array<
    BlogSectionContent & {
      illustrationUrl?: string;
    }
  >;
};

export function parseBlogContent(raw: unknown): BlogPostContent {
  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid blog content");
  }
  const sections = (raw as { sections?: unknown }).sections;
  if (!Array.isArray(sections)) {
    throw new Error("Blog content must include sections array");
  }
  return {
    sections: sections.map((s) => {
      const sec = s as Record<string, unknown>;
      return {
        heading: typeof sec.heading === "string" ? sec.heading : undefined,
        paragraphs: Array.isArray(sec.paragraphs)
          ? sec.paragraphs.filter((p): p is string => typeof p === "string")
          : [],
        bullets: Array.isArray(sec.bullets)
          ? sec.bullets.filter((b): b is string => typeof b === "string")
          : undefined,
        illustrationKey:
          typeof sec.illustrationKey === "string"
            ? sec.illustrationKey
            : undefined,
      };
    }),
  };
}
