import { API_URL } from "@/lib/api";
import type { BlogPost } from "./types";
import { BLOG_POSTS as STATIC_BLOG_POSTS } from "./registry";

type ApiBlogList = { posts: BlogPost[] };
type ApiBlogPost = { post: BlogPost };

export async function fetchPublishedBlogPosts(): Promise<BlogPost[]> {
  try {
    const res = await fetch(`${API_URL}/api/blog`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as ApiBlogList;
    if (!data.posts?.length) throw new Error("empty");
    return data.posts;
  } catch {
    return STATIC_BLOG_POSTS;
  }
}

export async function fetchPublishedBlogPost(
  slug: string
): Promise<BlogPost | undefined> {
  try {
    const res = await fetch(`${API_URL}/api/blog/${encodeURIComponent(slug)}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as ApiBlogPost;
    return data.post;
  } catch {
    return STATIC_BLOG_POSTS.find((p) => p.slug === slug);
  }
}

export async function fetchAllBlogSlugs(): Promise<string[]> {
  const posts = await fetchPublishedBlogPosts();
  return posts.map((p) => p.slug);
}
