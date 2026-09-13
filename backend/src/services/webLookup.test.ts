import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

vi.mock("./googleWebSearch.js", () => ({
  formatWebHits: (
    hits: Array<{ title: string; url: string; snippet: string }>
  ) =>
    hits
      .map((h, i) => `${i + 1}. ${h.title}${h.url ? ` (${h.url})` : ""}\n${h.snippet}`)
      .join("\n\n"),
  googleCustomSearchHits: vi.fn(),
  geminiGoogleSearchText: vi.fn(),
}));

vi.mock("../utils/fetchRetry.js", () => ({
  fetchWithRetry: vi.fn(),
}));

import { webLookup } from "./webLookup.js";
import {
  geminiGoogleSearchText,
  googleCustomSearchHits,
} from "./googleWebSearch.js";

const cse = vi.mocked(googleCustomSearchHits);
const gemini = vi.mocked(geminiGoogleSearchText);

describe("webLookup", () => {
  beforeEach(() => {
    cse.mockReset();
    gemini.mockReset();
    cse.mockResolvedValue([]);
    gemini.mockResolvedValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns unrestricted CSE hits for general scope (weather-style queries)", async () => {
    cse.mockResolvedValueOnce([
      {
        title: "Mumbai Weather",
        url: "https://weather.example/mumbai",
        snippet: "32°C partly cloudy",
      },
    ]);
    const text = await webLookup("weather today in mumbai", {
      sourceScope: "general",
      studyGoal: "UPSC",
    });
    expect(text).toContain("Mumbai Weather");
    expect(text).toContain("32°C");
    expect(text).not.toMatch(/Medium|Quora/i);
    // One unrestricted CSE call — no site: restrict for general.
    expect(cse).toHaveBeenCalledTimes(1);
    expect(cse.mock.calls[0][1]?.siteRestrict).toBeUndefined();
  });

  it("does not discard open-web CSE hits when track domains would not match", async () => {
    cse.mockImplementation(async (_q, opts) => {
      if (opts?.siteRestrict) return [];
      return [
        {
          title: "IMD Mumbai forecast",
          url: "https://mausam.imd.gov.in/mumbai",
          snippet: "Rain likely this evening",
        },
      ];
    });
    const text = await webLookup("weather mumbai", {
      sourceScope: "all",
      studyGoal: "UPSC",
    });
    expect(text).toContain("IMD Mumbai forecast");
    expect(text).toContain("Rain likely");
  });

  it("uses Gemini grounding once when CSE is empty", async () => {
    gemini.mockResolvedValueOnce("Mohali: high 33°C, partly cloudy.");
    const text = await webLookup("weather mohali today", {
      sourceScope: "general",
    });
    expect(text).toContain("Mohali");
    expect(gemini).toHaveBeenCalledTimes(1);
  });
});
