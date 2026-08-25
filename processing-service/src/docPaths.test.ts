import { describe, expect, it } from "vitest";
import {
  adminDocPrefix,
  contentHtmlKey,
  contentKeyFromPdfKey,
  sourcePdfKey,
  userDocPrefix,
} from "./docPaths.js";

describe("docPaths", () => {
  it("builds admin article paths with three segments", () => {
    const prefix = adminDocPrefix("polity", "rights", "overview");
    expect(prefix).toBe("admin/polity/rights/overview");
    expect(sourcePdfKey(prefix)).toBe(
      "admin/polity/rights/overview/source.pdf"
    );
    expect(contentHtmlKey(prefix)).toBe(
      "admin/polity/rights/overview/content.html"
    );
  });

  it("builds user paths", () => {
    expect(userDocPrefix("u1", "notes", "page-1")).toBe("users/u1/notes/page-1");
  });

  it("maps pdf key to content key", () => {
    expect(contentKeyFromPdfKey("admin/a/b/c/source.pdf")).toBe(
      "admin/a/b/c/content.html"
    );
  });
});
