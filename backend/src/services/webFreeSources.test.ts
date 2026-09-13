import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  looksLikeNewsQuery,
  looksLikeWeatherQuery,
  weatherPlaceFromQuery,
  wttrWeatherHits,
  googleNewsRssHits,
} from "./webFreeSources.js";

vi.mock("../utils/fetchRetry.js", () => ({
  fetchWithRetry: vi.fn(),
}));

import { fetchWithRetry } from "../utils/fetchRetry.js";

const fetchMock = vi.mocked(fetchWithRetry);

describe("webFreeSources", () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  it("detects weather and news intents", () => {
    expect(looksLikeWeatherQuery("what is the weather in mohali")).toBe(true);
    expect(looksLikeNewsQuery("current events in mohali")).toBe(true);
    expect(looksLikeWeatherQuery("photosynthesis notes")).toBe(false);
  });

  it("extracts place names from weather questions", () => {
    expect(weatherPlaceFromQuery("what is the weather today in mohali")).toBe(
      "mohali"
    );
    expect(weatherPlaceFromQuery("weather in Mumbai")).toMatch(/Mumbai/i);
  });

  it("formats wttr.in JSON as a weather hit", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        current_condition: [
          {
            temp_C: "33",
            FeelsLikeC: "35",
            humidity: "55",
            windspeedKmph: "10",
            weatherDesc: [{ value: "Partly Cloudy" }],
          },
        ],
        nearest_area: [
          {
            areaName: [{ value: "Mohali" }],
            country: [{ value: "India" }],
          },
        ],
        weather: [{ date: "2026-09-13", maxtempC: "34", mintempC: "25", hourly: [{ chanceofrain: "20" }] }],
      }),
    } as Response);

    const hits = await wttrWeatherHits("weather in mohali");
    expect(hits).toHaveLength(1);
    expect(hits[0].title).toContain("Mohali");
    expect(hits[0].snippet).toContain("33");
    expect(hits[0].snippet).toContain("Partly Cloudy");
  });

  it("parses Google News RSS items", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      text: async () => `<?xml version="1.0"?>
        <rss><channel>
          <item>
            <title><![CDATA[Mohali road project update]]></title>
            <link>https://news.example/mohali</link>
            <description><![CDATA[City officials announced...]]></description>
          </item>
        </channel></rss>`,
    } as Response);

    const hits = await googleNewsRssHits("current events in mohali");
    expect(hits).toHaveLength(1);
    expect(hits[0].title).toContain("Mohali road");
    expect(hits[0].url).toContain("news.example");
  });
});
