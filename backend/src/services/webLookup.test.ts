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

vi.mock("./webFreeSources.js", () => ({
  wttrWeatherHits: vi.fn(),
  googleNewsRssHits: vi.fn(),
  duckDuckGoHtmlHits: vi.fn(),
}));

vi.mock("../utils/fetchRetry.js", () => ({
  fetchWithRetry: vi.fn(),
}));

import { webLookup } from "./webLookup.js";
import {
  geminiGoogleSearchText,
  googleCustomSearchHits,
} from "./googleWebSearch.js";
import {
  duckDuckGoHtmlHits,
  googleNewsRssHits,
  wttrWeatherHits,
} from "./webFreeSources.js";

const cse = vi.mocked(googleCustomSearchHits);
const gemini = vi.mocked(geminiGoogleSearchText);
const wttr = vi.mocked(wttrWeatherHits);
const news = vi.mocked(googleNewsRssHits);
const ddgHtml = vi.mocked(duckDuckGoHtmlHits);

describe("webLookup", () => {
  beforeEach(() => {
    cse.mockReset();
    gemini.mockReset();
    wttr.mockReset();
    news.mockReset();
    ddgHtml.mockReset();
    cse.mockResolvedValue([]);
    gemini.mockResolvedValue(null);
    wttr.mockResolvedValue([]);
    news.mockResolvedValue([]);
    ddgHtml.mockResolvedValue([]);
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
    expect(cse).toHaveBeenCalledTimes(1);
    expect(cse.mock.calls[0][1]?.siteRestrict).toBeUndefined();
  });

  it("falls back to wttr when CSE and Gemini are empty", async () => {
    wttr.mockResolvedValueOnce([
      {
        title: "Weather — Mohali",
        url: "https://wttr.in/Mohali",
        snippet: "Mohali, India: Partly Cloudy. Now 33°C.",
      },
    ]);
    const text = await webLookup("what is weather in mohali", {
      sourceScope: "general",
    });
    expect(text).toContain("Mohali");
    expect(text).toContain("33°C");
    expect(wttr).toHaveBeenCalled();
  });

  it("uses Gemini grounding when CSE and free sources miss", async () => {
    gemini.mockResolvedValueOnce("Mohali: high 33°C, partly cloudy.");
    const text = await webLookup("obscure fact xyzzy", {
      sourceScope: "general",
    });
    expect(text).toContain("Mohali");
    expect(gemini).toHaveBeenCalledTimes(1);
  });
});
