import { describe, expect, it, vi } from "vitest";
import { openPdfDocument } from "./openPdfDocument";

describe("openPdfDocument", () => {
  it("forwards pdf.js load progress", async () => {
    const onProgress = vi.fn();
    const promise = Promise.resolve({ numPages: 1 });
    const task = {
      onProgress: null as
        | ((data: { loaded: number; total: number }) => void)
        | null,
      promise,
    };
    const pdfjsModule = {
      getDocument: vi.fn(() => task),
    } as unknown as typeof import("pdfjs-dist");

    void openPdfDocument(pdfjsModule, { url: "https://example.com/a.pdf" }, onProgress);
    task.onProgress?.({ loaded: 250, total: 1000 });

    expect(onProgress).toHaveBeenCalledWith({
      loaded: 250,
      total: 1000,
      percent: 25,
    });
  });

  it("caps percent at 100", async () => {
    const onProgress = vi.fn();
    const task = {
      onProgress: null as
        | ((data: { loaded: number; total: number }) => void)
        | null,
      promise: Promise.resolve({ numPages: 1 }),
    };
    const pdfjsModule = {
      getDocument: vi.fn(() => task),
    } as unknown as typeof import("pdfjs-dist");

    void openPdfDocument(pdfjsModule, { url: "https://example.com/a.pdf" }, onProgress);
    task.onProgress?.({ loaded: 1200, total: 1000 });

    expect(onProgress).toHaveBeenCalledWith({
      loaded: 1200,
      total: 1000,
      percent: 100,
    });
  });
});
