import { describe, expect, it } from "vitest";
import { BLOG_POSTS, getAllBlogSlugs, getBlogPost } from "./registry";
import { enrichBlogPosts } from "./enrichBlogPost";

describe("blog registry", () => {
  it("has unique slugs", () => {
    const slugs = getAllBlogSlugs();
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("publishes at least 30 SEO articles", () => {
    expect(BLOG_POSTS.length).toBeGreaterThanOrEqual(30);
  });

  it("resolves every registered post", () => {
    for (const post of BLOG_POSTS) {
      expect(getBlogPost(post.slug)).toEqual(post);
      expect(post.title.length).toBeGreaterThan(10);
      expect(post.description.length).toBeGreaterThan(40);
      expect(post.sections.length).toBeGreaterThan(0);
    }
  });

  it("enriches short posts into long indexed articles", () => {
    const enriched = enrichBlogPosts(BLOG_POSTS);
    expect(enriched.length).toBe(BLOG_POSTS.length);
    for (const post of enriched) {
      expect(post.sections.length).toBeGreaterThanOrEqual(6);
      expect(post.readingMinutes).toBeGreaterThanOrEqual(10);
      expect(post.description.length).toBeGreaterThan(50);
    }
  });
});
