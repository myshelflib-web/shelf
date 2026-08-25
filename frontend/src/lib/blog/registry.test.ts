import { describe, expect, it } from "vitest";
import { BLOG_POSTS, getAllBlogSlugs, getBlogPost } from "./registry";

describe("blog registry", () => {
  it("has unique slugs", () => {
    const slugs = getAllBlogSlugs();
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("resolves every registered post", () => {
    for (const post of BLOG_POSTS) {
      expect(getBlogPost(post.slug)).toEqual(post);
      expect(post.title.length).toBeGreaterThan(10);
      expect(post.description.length).toBeGreaterThan(40);
      expect(post.sections.length).toBeGreaterThan(0);
    }
  });
});
