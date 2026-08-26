import { describe, expect, it } from "vitest";
import {
  formatWebHits,
  hitsFromCustomSearch,
  textFromGeminiGrounding,
} from "./googleWebSearch.js";

describe("googleWebSearch", () => {
  it("maps Custom Search JSON items", () => {
    const hits = hitsFromCustomSearch({
      items: [
        {
          title: "Photosynthesis",
          link: "https://example.edu/p",
          snippet: "Plants make food.",
        },
        {},
      ],
    });
    expect(hits).toHaveLength(1);
    expect(hits[0].url).toBe("https://example.edu/p");
    expect(formatWebHits(hits)).toContain("Photosynthesis");
    expect(formatWebHits(hits)).toContain("https://example.edu/p");
  });

  it("formats Gemini grounding text and source URLs", () => {
    const text = textFromGeminiGrounding({
      candidates: [
        {
          content: { parts: [{ text: "Chlorophyll absorbs light." }] },
          groundingMetadata: {
            groundingChunks: [
              { web: { title: "NASA", uri: "https://nasa.gov/chloro" } },
            ],
          },
        },
      ],
    });
    expect(text).toContain("Chlorophyll absorbs light.");
    expect(text).toContain("NASA");
    expect(text).toContain("https://nasa.gov/chloro");
  });

  it("returns null when Gemini grounding is empty", () => {
    expect(textFromGeminiGrounding({ candidates: [{}] })).toBeNull();
  });
});
