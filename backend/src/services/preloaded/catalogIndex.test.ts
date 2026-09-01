import { describe, expect, it } from "vitest";
import { ALL_PRELOADED_CATALOG } from "./catalogIndex.js";
import { isPdfUrl } from "../curriculumSavePolicy.js";

describe("preloaded catalog", () => {
  it("seeds only official PDFs that can load in the reader", () => {
    expect(ALL_PRELOADED_CATALOG.length).toBeGreaterThan(10);
    for (const entry of ALL_PRELOADED_CATALOG) {
      expect(entry.license).toBe("OFFICIAL_DOCUMENT");
      expect(isPdfUrl(entry.sourceUrl), entry.slug).toBe(true);
    }
  });
});
