import { describe, expect, it } from "vitest";
import {
  canOptimisticMount,
  canOptimisticMountPdf,
  optimisticLoadedPage,
  optimisticPdfLoadedPage,
} from "@/components/my-content/reader/optimisticPdfPage";

describe("optimisticLoadedPage", () => {
  it("builds a PDF shell with scope slugs", () => {
    const page = optimisticPdfLoadedPage({
      id: "p1",
      title: "Notes",
      scope: {
        kind: "topic",
        notebookSlug: "polity",
        topicSlug: "constitution",
        pageSlug: "notes",
      },
    });
    expect(page.contentType).toBe("PDF");
    expect(page.id).toBe("p1");
    expect(page.notebookSlug).toBe("polity");
    expect(page.topicSlug).toBe("constitution");
    expect(page.content).toBe("");
  });

  it("seeds link and video sourceUrl", () => {
    const link = optimisticLoadedPage({
      id: "l1",
      title: "Article",
      scope: { kind: "root-file", pageSlug: "article" },
      contentType: "LINK",
      sourceUrl: "https://example.com",
    });
    expect(link.contentType).toBe("LINK");
    expect(link.sourceUrl).toBe("https://example.com");
  });
});

describe("canOptimisticMount", () => {
  const root = { kind: "root-file" as const, pageSlug: "notes" };

  it("allows PDF with pageId", () => {
    expect(
      canOptimisticMountPdf({
        pageId: "p1",
        contentType: "PDF",
        scope: root,
      })
    ).toBe(true);
  });

  it("requires sourceUrl seed for LINK/VIDEO", () => {
    expect(
      canOptimisticMount({
        pageId: "p1",
        contentType: "LINK",
        scope: root,
        seed: null,
      })
    ).toBe(false);
    expect(
      canOptimisticMount({
        pageId: "p1",
        contentType: "LINK",
        scope: root,
        seed: {
          pageId: "p1",
          href: "/my-content/file/notes",
          contentType: "LINK",
          sourceUrl: "https://example.com",
        },
      })
    ).toBe(true);
  });

  it("requires HTML content seed for docs/sketches", () => {
    expect(
      canOptimisticMount({
        pageId: "p1",
        contentType: "HTML",
        scope: root,
        seed: {
          pageId: "p1",
          href: "/x",
          contentType: "HTML",
        },
      })
    ).toBe(false);
    expect(
      canOptimisticMount({
        pageId: "p1",
        contentType: "HTML",
        scope: root,
        seed: {
          pageId: "p1",
          href: "/x",
          contentType: "HTML",
          content: "<div class='shelf-doc-editor'></div>",
        },
      })
    ).toBe(true);
  });

  it("allows imported text types when seed has content", () => {
    expect(
      canOptimisticMount({
        pageId: "p1",
        contentType: "MARKDOWN",
        scope: root,
      })
    ).toBe(false);
    expect(
      canOptimisticMount({
        pageId: "p1",
        contentType: "MARKDOWN",
        scope: root,
        seed: {
          pageId: "p1",
          href: "/x",
          contentType: "MARKDOWN",
          content: "<pre>hi</pre>",
        },
      })
    ).toBe(true);
  });
});
