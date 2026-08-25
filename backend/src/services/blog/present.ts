import type { BlogPost } from "@prisma/client";
import { readBlogContent } from "./storage.js";
import type { BlogPostContent, BlogPostPublic, BlogPostSummary } from "./types.js";

function mediaUrl(key: string | null | undefined, apiBase: string): string | undefined {
  if (!key) return undefined;
  return `${apiBase}/api/blog/media/${encodeURIComponent(key)}`;
}

export function toBlogSummary(
  row: BlogPost,
  apiBase: string
): BlogPostSummary {
  return {
    slug: row.slug,
    title: row.title,
    description: row.description,
    excerpt: row.excerpt,
    publishedAt: (row.publishedAt ?? row.createdAt).toISOString().slice(0, 10),
    updatedAt: row.updatedAt.toISOString().slice(0, 10),
    tags: row.tags,
    readingMinutes: row.readingMinutes,
    coverImageUrl: mediaUrl(row.coverImageKey, apiBase),
    heroIllustrationUrl: mediaUrl(row.heroImageKey, apiBase),
  };
}

export async function toBlogPublic(
  row: BlogPost,
  apiBase: string
): Promise<BlogPostPublic> {
  const content = await readBlogContent(row.contentKey);
  const summary = toBlogSummary(row, apiBase);
  return {
    ...summary,
    sections: content.sections.map((section) => ({
      ...section,
      illustrationUrl: mediaUrl(section.illustrationKey, apiBase),
    })),
  };
}

export function contentFromBody(sections: BlogPostContent["sections"]): BlogPostContent {
  return { sections };
}
