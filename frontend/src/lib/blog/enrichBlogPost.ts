import type { BlogPost } from "./types";
import { BLOG_EXPANSIONS } from "./blogExpansions";
import { BLOG_SEO_KEYWORDS } from "@/lib/seo/keywords";

function mergeSeoTags(post: BlogPost): string[] {
  const extra = BLOG_SEO_KEYWORDS[post.slug] ?? [];
  return [...new Set([...post.tags, ...extra])];
}

function wordCount(post: BlogPost): number {
  let n = 0;
  const count = (text: string) => {
    n += text.trim().split(/\s+/).filter(Boolean).length;
  };
  count(post.excerpt);
  for (const section of post.sections) {
    if (section.heading) count(section.heading);
    section.paragraphs.forEach(count);
    section.bullets?.forEach(count);
  }
  return n;
}

function readingMinutesFromWords(words: number): number {
  return Math.max(12, Math.min(18, Math.ceil(words / 180)));
}

/** Append long-form sections, SEO tags, and refresh read time for every published post. */
export function enrichBlogPost(post: BlogPost): BlogPost {
  const extra = BLOG_EXPANSIONS[post.slug];
  const tags = mergeSeoTags(post);

  if (!extra?.length) {
    return tags.length === post.tags.length ? post : { ...post, tags };
  }

  const sections = [...post.sections, ...extra];
  const enriched: BlogPost = { ...post, sections, tags };
  return {
    ...enriched,
    readingMinutes: readingMinutesFromWords(wordCount(enriched)),
  };
}

export function enrichBlogPosts(posts: BlogPost[]): BlogPost[] {
  return posts.map(enrichBlogPost);
}
