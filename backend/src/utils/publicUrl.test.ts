import { describe, expect, it } from "vitest";
import { parsePublicHttpUrl } from "./publicUrl.js";

describe("parsePublicHttpUrl", () => {
  it("accepts https pages and pdfs", () => {
    expect(parsePublicHttpUrl("https://example.com/notes.pdf")).toBe(
      "https://example.com/notes.pdf"
    );
  });

  it("rejects local and private hosts", () => {
    expect(parsePublicHttpUrl("http://localhost/secret")).toBeNull();
    expect(parsePublicHttpUrl("http://127.0.0.1/x")).toBeNull();
    expect(parsePublicHttpUrl("http://192.168.0.5/x")).toBeNull();
  });

  it("rejects non-http schemes", () => {
    expect(parsePublicHttpUrl("javascript:alert(1)")).toBeNull();
    expect(parsePublicHttpUrl("file:///etc/passwd")).toBeNull();
  });
});
