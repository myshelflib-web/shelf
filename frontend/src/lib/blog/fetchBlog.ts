import { API_URL } from "@/lib/api";
import { enrichBlogPost, enrichBlogPosts } from "./enrichBlogPost";
import { BLOG_POSTS as STATIC_BLOG_POSTS, getAllBlogSlugs } from "./registry";
import type { BlogPost } from "./types";

type ApiBlogList = { posts: BlogPost[] };
type ApiBlogPost = { post: BlogPost };

async function fetchApiBlogSummaries(): Promise<Map<string, BlogPost>> {
  try {
    const res = await fetch(`${API_URL}/api/blog`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return new Map();
    const data = (await res.json()) as ApiBlogList;
    return new Map((data.posts ?? []).map((post) => [post.slug, post]));
  } catch {
    return new Map();
  }
}

function mergeStaticWithApiSummaries(apiBySlug: Map<string, BlogPost>): BlogPost[] {
  const merged = STATIC_BLOG_POSTS.map((staticPost) => {
    const api = apiBySlug.get(staticPost.slug);
    if (!api) return staticPost;
    return {
      ...staticPost,
      title: api.title,
      description: api.description,
      excerpt: api.excerpt,
      publishedAt: api.publishedAt,
      updatedAt: api.updatedAt ?? api.publishedAt,
      tags: api.tags,
      readingMinutes: api.readingMinutes,
      coverImageUrl: api.coverImageUrl,
      heroIllustrationUrl: api.heroIllustrationUrl,
    };
  });

  for (const apiPost of apiBySlug.values()) {
    if (!merged.some((post) => post.slug === apiPost.slug)) {
      merged.push(apiPost);
    }
  }

  return merged.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export async function fetchPublishedBlogPosts(): Promise<BlogPost[]> {
  const apiBySlug = await fetchApiBlogSummaries();
  return enrichBlogPosts(mergeStaticWithApiSummaries(apiBySlug));
}

export async function fetchPublishedBlogPost(
  slug: string
): Promise<BlogPost | undefined> {
  const staticPost = STATIC_BLOG_POSTS.find((p) => p.slug === slug);
  const apiBySlug = await fetchApiBlogSummaries();

  if (apiBySlug.has(slug)) {
    try {
      const res = await fetch(`${API_URL}/api/blog/${encodeURIComponent(slug)}`, {
        next: { revalidate: 300 },
      });
      if (res.ok) {
        const data = (await res.json()) as ApiBlogPost;
        if (data.post) return enrichBlogPost(data.post);
      }
    } catch {
      // fall through to static catalog
    }
  }

  return staticPost ? enrichBlogPost(staticPost) : undefined;
}

export async function fetchAllBlogSlugs(): Promise<string[]> {
  return getAllBlogSlugs();
}
