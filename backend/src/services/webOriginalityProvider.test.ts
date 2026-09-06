import { describe, expect, it } from "vitest";
import { parseCopyleaksCompletedPayload } from "./copyleaksClient.js";
import {
  completeScanFromWebhook,
  getScanResult,
  rememberPendingScan,
  resetWebOriginalityProviderForTests,
} from "./webOriginalityProvider.js";

describe("parseCopyleaksCompletedPayload", () => {
  it("maps internet results to matches", () => {
    const parsed = parseCopyleaksCompletedPayload({
      scannedDocument: { totalWords: 100 },
      results: {
        score: { aggregatedScore: 22.5 },
        internet: [
          {
            url: "https://example.com/a",
            introduction: "overlap text",
            matchedWords: 40,
          },
        ],
      },
    });
    expect(parsed.scorePercent).toBe(22.5);
    expect(parsed.matches).toHaveLength(1);
    expect(parsed.matches[0]?.url).toBe("https://example.com/a");
    expect(parsed.matches[0]?.score).toBe(0.4);
  });
});

describe("web originality scan store", () => {
  it("completes a pending scan from webhook", () => {
    resetWebOriginalityProviderForTests();
    rememberPendingScan("abc12345scan", "user-1");
    completeScanFromWebhook("abc12345scan", "completed", {
      scannedDocument: { totalWords: 50 },
      results: {
        score: { aggregatedScore: 10 },
        internet: [{ url: "https://ex.com", matchedWords: 5 }],
      },
    });
    const result = getScanResult("abc12345scan");
    expect(result?.status).toBe("ok");
    expect(result?.matches?.[0]?.url).toBe("https://ex.com");
  });
});
