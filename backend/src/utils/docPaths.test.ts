import { describe, expect, it } from "vitest";
import {
  adminDocPrefix,
  contentHtmlKey,
  contentKeyFromPdfKey,
  pageHref,
  sourcePdfKey,
  userDocPrefix,
} from "./docPaths.js";

describe("docPaths", () => {
  it("builds admin article paths", () => {
    const prefix = adminDocPrefix("polity", "rights", "overview");
    expect(prefix).toBe("admin/polity/rights/overview");
    expect(sourcePdfKey(prefix)).toBe("admin/polity/rights/overview/source.pdf");
    expect(contentHtmlKey(prefix)).toBe(
      "admin/polity/rights/overview/content.html"
    );
  });

  it("builds user paths for topic, notebook, and root pages", () => {
    expect(userDocPrefix("u1", "notes", "general", "page-1")).toBe(
      "users/u1/notes/general/page-1"
    );
    expect(userDocPrefix("u1", "notes", null, "page-1")).toBe(
      "users/u1/notes/_file/page-1"
    );
    expect(userDocPrefix("u1", null, null, "page-1")).toBe(
      "users/u1/_file/page-1"
    );
  });

  it("builds reader hrefs for three scopes", () => {
    expect(pageHref(null, null, "solo")).toBe("/my-content/file/solo");
    expect(pageHref("notes", null, "solo")).toBe("/my-content/notes/file/solo");
    expect(pageHref("notes", "general", "solo")).toBe(
      "/my-content/notes/general/solo"
    );
  });

  it("derives content key from pdf key", () => {
    expect(
      contentKeyFromPdfKey("admin/polity/rights/overview/source.pdf")
    ).toBe("admin/polity/rights/overview/content.html");
  });
});
