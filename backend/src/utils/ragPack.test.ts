import { describe, expect, it } from "vitest";
import { compactHistory, packLibraryExcerpts } from "./ragPack.js";

describe("packLibraryExcerpts", () => {
  it("numbers citations and stays under budget", () => {
    const packed = packLibraryExcerpts(
      [
        {
          pageId: "1",
          title: "Habeas",
          notebook: "Law",
          topic: "Rights",
          href: "/a",
          text: "A".repeat(500),
          score: 0.9,
        },
        {
          pageId: "2",
          title: "Bail",
          notebook: "Law",
          topic: "",
          href: "/b",
          text: "B".repeat(500),
          score: 0.8,
        },
      ],
      800
    );
    expect(packed.citations).toHaveLength(2);
    expect(packed.citations[0].n).toBe(1);
    expect(packed.used).toBeLessThanOrEqual(850);
    expect(packed.numbered).toContain("[1]");
  });
});

describe("compactHistory", () => {
  it("truncates older assistant turns", () => {
    const history = [
      { role: "user" as const, content: "q1" },
      { role: "assistant" as const, content: "x".repeat(2000) },
      { role: "user" as const, content: "q2" },
      { role: "assistant" as const, content: "short" },
    ];
    const out = compactHistory(history, 16);
    expect(out[1].content.length).toBeLessThan(2000);
    expect(out[3].content).toBe("short");
  });
});
