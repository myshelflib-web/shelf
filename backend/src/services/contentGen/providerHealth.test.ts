import { describe, expect, it } from "vitest";
import {
  backoffDelayMs,
  isFatalProviderError,
  isProviderOutage,
  isStopError,
} from "./providerHealth.js";

describe("isProviderOutage", () => {
  it("treats rate limits and 5xx as recoverable downtime", () => {
    expect(isProviderOutage(new Error("Sarvam request failed (429): rate limit"))).toBe(
      true
    );
    expect(isProviderOutage(new Error("Sarvam request failed (503)"))).toBe(true);
    expect(isProviderOutage(new Error("fetch failed"))).toBe(true);
    expect(isProviderOutage(new Error("request timed out"))).toBe(true);
  });

  it("does not pause on an auth failure — that never recovers on its own", () => {
    expect(isProviderOutage(new Error("Sarvam request failed (401)"))).toBe(false);
    expect(isProviderOutage(new Error("SARVAM_API_KEY is not set"))).toBe(false);
  });

  it("does not pause on an ordinary content failure", () => {
    expect(isProviderOutage(new Error("Model did not return a usable article draft"))).toBe(
      false
    );
  });

  it("does not treat a Stop abort as provider downtime", () => {
    const abort = new Error("This operation was aborted");
    abort.name = "AbortError";
    expect(isStopError(abort)).toBe(true);
    expect(isProviderOutage(abort)).toBe(false);
    expect(isFatalProviderError(abort)).toBe(false);
    expect(isProviderOutage(new Error("Stopped by admin"))).toBe(false);
  });
});

describe("isFatalProviderError", () => {
  it("flags credential problems", () => {
    expect(isFatalProviderError(new Error("Sarvam request failed (403)"))).toBe(true);
    expect(isFatalProviderError(new Error("invalid api key"))).toBe(true);
  });

  it("leaves transient failures alone", () => {
    expect(isFatalProviderError(new Error("502 bad gateway"))).toBe(false);
  });
});

describe("backoffDelayMs", () => {
  it("doubles each attempt and then holds at the cap", () => {
    expect(backoffDelayMs(0)).toBe(30_000);
    expect(backoffDelayMs(1)).toBe(60_000);
    expect(backoffDelayMs(3)).toBe(240_000);
    expect(backoffDelayMs(20)).toBe(15 * 60_000);
  });
});
