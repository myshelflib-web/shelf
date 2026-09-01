import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { BLOG_POSTS } from "./registry";

describe("fetchBlog", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url.endsWith("/api/blog")) {
          return {
            ok: true,
            json: async () => ({
              posts: [{ slug: "personal-study-library-collections", title: "From API" }],
            }),
          };
        }
        if (url.includes("/api/blog/personal-study-library-collections")) {
          return {
            ok: true,
            json: async () => ({
              post: BLOG_POSTS.find((p) => p.slug === "personal-study-library-collections"),
            }),
          };
        }
        if (url.includes("/api/blog/current-affairs-dashboard-ingestion")) {
          return { ok: false, status: 404 };
        }
        return { ok: false, status: 404 };
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not request unseeded slugs from the API", async () => {
    const { fetchPublishedBlogPost } = await import("./fetchBlog");
    const post = await fetchPublishedBlogPost("current-affairs-dashboard-ingestion");
    expect(post?.slug).toBe("current-affairs-dashboard-ingestion");

    const calls = (fetch as ReturnType<typeof vi.fn>).mock.calls.map(([url]) =>
      String(url)
    );
    expect(calls.some((url) => url.includes("current-affairs-dashboard-ingestion"))).toBe(
      false
    );
    expect(calls.some((url) => url.endsWith("/api/blog"))).toBe(true);
  });

  it("loads seeded slugs from the API when listed", async () => {
    const { fetchPublishedBlogPost } = await import("./fetchBlog");
    const seeded = BLOG_POSTS.find((p) => p.slug === "personal-study-library-collections");
    expect(seeded).toBeDefined();

    const post = await fetchPublishedBlogPost("personal-study-library-collections");
    expect(post?.slug).toBe("personal-study-library-collections");

    const calls = (fetch as ReturnType<typeof vi.fn>).mock.calls.map(([url]) =>
      String(url)
    );
    expect(
      calls.some((url) => url.includes("/api/blog/personal-study-library-collections"))
    ).toBe(true);
  });
});
