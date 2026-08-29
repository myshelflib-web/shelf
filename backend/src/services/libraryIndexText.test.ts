import { describe, expect, it } from "vitest";
import { assembleIndexText, isIndexableTextKey } from "./libraryIndexText.js";

describe("assembleIndexText", () => {
  it("indexes catalog metadata even when the file body is title-only", () => {
    const text = assembleIndexText({
      title: "My Page",
      contentType: "PDF",
      notebook: "Polity",
      topic: "Constitution",
      fileText: "My Page",
    });
    expect(text).toContain("Type: PDF");
    expect(text).toContain("Collection: Polity");
    expect(text).not.toMatch(/Content:\nMy Page/);
  });

  it("keeps real file text and highlight notes", () => {
    const text = assembleIndexText({
      title: "Federalism",
      contentType: "HTML",
      notebook: "Notes",
      topic: "",
      fileText: "Federalism splits power between Union and States. ".repeat(4),
      highlights: [{ text: "Union List", note: "revise" }],
    });
    expect(text).toContain("Content:");
    expect(text).toContain("Union List");
    expect(text).toContain("Note: revise");
  });
});

describe("isIndexableTextKey", () => {
  it("refuses PDF object keys so the indexer never buffers source.pdf", () => {
    expect(isIndexableTextKey("users/a/_file/p/content.html")).toBe(true);
    expect(isIndexableTextKey("users/a/_file/p/source.pdf")).toBe(false);
    expect(isIndexableTextKey("notes.pdf")).toBe(false);
  });
});
