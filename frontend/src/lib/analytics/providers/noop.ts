import type { AnalyticsProvider } from "../types";

export function createNoopProvider(): AnalyticsProvider {
  return {
    init() {},
    track() {},
    identify() {},
    reset() {},
    pageview() {},
  };
}
