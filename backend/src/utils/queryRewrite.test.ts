import { describe, expect, it } from "vitest";
import { rewriteSearchQuery } from "./queryRewrite.js";

describe("rewriteSearchQuery", () => {
  it("returns the query when there is no history", () => {
    expect(rewriteSearchQuery("What is habeas corpus?")).toBe(
      "What is habeas corpus?"
    );
  });

  it("expands short follow-ups with the prior user turn", () => {
    const out = rewriteSearchQuery("explain this", [
      { role: "user", content: "What is Article 21?" },
      { role: "assistant", content: "Article 21 protects life and liberty." },
    ]);
    expect(out).toContain("Article 21");
    expect(out).toContain("explain this");
  });

  it("leaves a standalone detailed question unchanged", () => {
    const q =
      "Compare the basic structure doctrine with parliamentary sovereignty using Kesavananda Bharati.";
    expect(
      rewriteSearchQuery(q, [{ role: "user", content: "Earlier notes on DPSP" }])
    ).toBe(q);
  });
});
