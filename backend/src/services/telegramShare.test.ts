import { describe, expect, it } from "vitest";
import {
  pdfFilenameForTelegram,
  telegramApiErrorMessage,
} from "./telegramShare.js";

describe("pdfFilenameForTelegram", () => {
  it("keeps a simple title and adds .pdf", () => {
    expect(pdfFilenameForTelegram("Polity chapter 3")).toBe(
      "Polity chapter 3.pdf"
    );
  });

  it("strips path characters", () => {
    expect(pdfFilenameForTelegram('a/b\\c:d*e?f"g<h>i|j')).toBe(
      "abcdefghij.pdf"
    );
  });

  it("does not double .pdf", () => {
    expect(pdfFilenameForTelegram("Notes.PDF")).toBe("Notes.PDF");
  });

  it("falls back when the title is empty", () => {
    expect(pdfFilenameForTelegram("   ")).toBe("document.pdf");
  });
});

describe("telegramApiErrorMessage", () => {
  it("maps blocked bot", () => {
    expect(
      telegramApiErrorMessage(new Error("Forbidden: bot was blocked by the user"))
    ).toMatch(/Unblock/);
  });

  it("maps unstarted chat", () => {
    expect(
      telegramApiErrorMessage(
        new Error("Forbidden: bot can't initiate conversation with a user")
      )
    ).toMatch(/tap Start/);
  });

  it("maps oversized files", () => {
    expect(telegramApiErrorMessage(new Error("file is too big"))).toMatch(
      /50 MB/
    );
  });
});
