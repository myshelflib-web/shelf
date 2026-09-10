import { describe, expect, it } from "vitest";
import {
  canOptimisticMountPdf,
  optimisticPdfLoadedPage,
} from "@/components/my-content/reader/optimisticPdfPage";

describe("optimisticPdfLoadedPage", () => {
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
});

describe("canOptimisticMountPdf", () => {
  it("requires pageId and PDF contentType", () => {
    expect(
      canOptimisticMountPdf({
        pageId: "p1",
        contentType: "PDF",
        scope: { kind: "root-file", pageSlug: "notes" },
      })
    ).toBe(true);
    expect(
      canOptimisticMountPdf({
        pageId: "p1",
        contentType: "HTML",
        scope: { kind: "root-file", pageSlug: "notes" },
      })
    ).toBe(false);
    expect(
      canOptimisticMountPdf({
        contentType: "PDF",
        scope: { kind: "root-file", pageSlug: "notes" },
      })
    ).toBe(false);
  });
});
