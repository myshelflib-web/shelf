import { describe, expect, it, vi } from "vitest";
import type { AnalyticsProvider } from "./types";
import {
  __setAnalyticsProviderForTests,
  track,
  identifyUser,
  resetAnalytics,
  pageview,
} from "./client";
import { AnalyticsEvents } from "./events";

function mockProvider(): AnalyticsProvider & {
  tracks: Array<{ event: string; props?: Record<string, unknown> }>;
} {
  const tracks: Array<{ event: string; props?: Record<string, unknown> }> = [];
  return {
    tracks,
    init: vi.fn(),
    track: (event, properties) => tracks.push({ event, props: properties }),
    identify: vi.fn(),
    reset: vi.fn(),
    pageview: (url, properties) =>
      tracks.push({ event: "$pageview", props: { url, ...properties } }),
  };
}

describe("analytics client", () => {
  it("delegates track calls to the active provider", () => {
    const provider = mockProvider();
    __setAnalyticsProviderForTests(provider);

    track(AnalyticsEvents.searchOpened);
    track(AnalyticsEvents.highlightCreated, { kind: "TEXT" });

    expect(provider.tracks).toEqual([
      { event: AnalyticsEvents.searchOpened, props: undefined },
      {
        event: AnalyticsEvents.highlightCreated,
        props: { kind: "TEXT" },
      },
    ]);
  });

  it("delegates identify, reset, and pageview", () => {
    const provider = mockProvider();
    __setAnalyticsProviderForTests(provider);

    identifyUser("user-1", { plan: "FREE" });
    pageview("/dashboard");
    resetAnalytics();

    expect(provider.identify).toHaveBeenCalledWith("user-1", { plan: "FREE" });
    expect(provider.tracks).toContainEqual({
      event: "$pageview",
      props: { url: "/dashboard" },
    });
    expect(provider.reset).toHaveBeenCalled();
  });
});
