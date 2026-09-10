import { describe, expect, it, beforeEach } from "vitest";
import {
  formatBulkImportSummary,
  listFailedBulkUploads,
  rememberFailedBulkUpload,
  removeFailedBulkUpload,
} from "./failedBulkUploads";

describe("formatBulkImportSummary", () => {
  it("describes full success", () => {
    expect(formatBulkImportSummary({ succeeded: 5, failed: 0, total: 5 })).toEqual({
      title: "Imported 5 files",
      detail: "All files uploaded",
    });
  });

  it("describes partial import with sample names", () => {
    const s = formatBulkImportSummary({
      succeeded: 84,
      failed: 16,
      total: 100,
      sampleNames: ["a.pdf", "b.pdf", "c.pdf", "d.pdf"],
    });
    expect(s.title).toBe("Import · 84 of 100");
    expect(s.detail).toContain("16 failed");
    expect(s.detail).toContain("Retry failed");
    expect(s.detail).toContain("+1 more");
  });

  it("describes total failure", () => {
    const s = formatBulkImportSummary({
      succeeded: 0,
      failed: 3,
      total: 3,
    });
    expect(s.title).toMatch(/Import failed/);
    expect(s.detail).toMatch(/Retry failed/);
  });
});

describe("rememberFailedBulkUpload", () => {
  beforeEach(() => {
    for (const row of listFailedBulkUploads()) {
      removeFailedBulkUpload(row.id);
    }
  });

  it("stores file for later retry", () => {
    const file = new File(["x"], "notes.pdf", { type: "application/pdf" });
    rememberFailedBulkUpload({
      batchId: "bulk:1",
      file,
      title: "notes",
      notebookId: "n1",
      notebookSlug: "n1",
      topicSlug: null,
      lastError: "network",
    });
    expect(listFailedBulkUploads()).toHaveLength(1);
    expect(listFailedBulkUploads()[0]?.file.name).toBe("notes.pdf");
  });
});
