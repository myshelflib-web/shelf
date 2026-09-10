import { describe, expect, it } from "vitest";
import {
  COMPRESS_PDF_MAX_ATTEMPT_BYTES,
  COMPRESS_PDF_MIN_ATTEMPT_BYTES,
  decidePdfCompress,
  pdfLooksAlreadyPacked,
} from "./pdfCompressDecision";

describe("pdfLooksAlreadyPacked", () => {
  it("detects /ObjStm in the header probe window", () => {
    const raw = new TextEncoder().encode("%PDF-1.7\n/ObjStm 12 0 R\n");
    expect(pdfLooksAlreadyPacked(raw)).toBe(true);
  });

  it("returns false when object streams are absent", () => {
    const raw = new TextEncoder().encode("%PDF-1.4\n1 0 obj<<>>endobj\n");
    expect(pdfLooksAlreadyPacked(raw)).toBe(false);
  });
});

describe("decidePdfCompress", () => {
  it("skips tiny, sub-1MB, and oversized PDFs but marks clientPacked", () => {
    const tiny = new File([new Uint8Array(1024)], "a.pdf", {
      type: "application/pdf",
    });
    expect(decidePdfCompress(tiny)).toEqual({
      attempt: false,
      clientPacked: true,
    });

    const resume = new File(
      [new Uint8Array(COMPRESS_PDF_MIN_ATTEMPT_BYTES - 1)],
      "resume.pdf",
      { type: "application/pdf" }
    );
    expect(decidePdfCompress(resume)).toEqual({
      attempt: false,
      clientPacked: true,
    });

    const huge = new File(
      [new Uint8Array(COMPRESS_PDF_MAX_ATTEMPT_BYTES + 1)],
      "b.pdf",
      { type: "application/pdf" }
    );
    expect(decidePdfCompress(huge)).toEqual({
      attempt: false,
      clientPacked: true,
    });
  });

  it("attempts mid-size PDFs", () => {
    const mid = new File(
      [new Uint8Array(COMPRESS_PDF_MIN_ATTEMPT_BYTES + 64)],
      "c.pdf",
      { type: "application/pdf" }
    );
    expect(decidePdfCompress(mid)).toEqual({
      attempt: true,
      clientPacked: true,
    });
  });
});
