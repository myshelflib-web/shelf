import type { BlogPost } from "./types";
import { BLOG_EXPANSIONS } from "./blogExpansions";
import { BLOG_SEO_KEYWORDS } from "../seo/keywords";
import { BLOG_SEO_KEYWORDS_TRAFFIC } from "../seo/blogSeoKeywordsTraffic";
import { estimateReadingMinutes } from "./longPost";

const LONG_SECTION_THRESHOLD = 6;

const ALL_BLOG_SEO_KEYWORDS: Record<string, string[]> = {
  ...BLOG_SEO_KEYWORDS,
  ...BLOG_SEO_KEYWORDS_TRAFFIC,
};

function mergeSeoTags(post: BlogPost): string[] {
  const extra = ALL_BLOG_SEO_KEYWORDS[post.slug] ?? [];
  return [...new Set([...post.tags, ...extra])];
}

/**
 * Merge SEO tags; append expansion sections only for short catalog posts.
 * Already-long posts (and S3-seeded long bodies) are left intact to avoid duplicates.
 */
export function enrichBlogPost(post: BlogPost): BlogPost {
  const tags = mergeSeoTags(post);
  const extra = BLOG_EXPANSIONS[post.slug];
  const shouldExpand =
    !!extra?.length && post.sections.length < LONG_SECTION_THRESHOLD;

  const sections = shouldExpand
    ? [...post.sections, ...extra]
    : post.sections;

  const enriched: BlogPost = { ...post, sections, tags };
  return {
    ...enriched,
    readingMinutes: estimateReadingMinutes(sections, post.excerpt),
  };
}

export function enrichBlogPosts(posts: BlogPost[]): BlogPost[] {
  return posts.map(enrichBlogPost);
}
