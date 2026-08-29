import posthog from "posthog-js";
import type { AnalyticsProvider } from "../types";

export function createPostHogProvider(
  key: string,
  host?: string
): AnalyticsProvider {
  let ready = false;

  return {
    init() {
      if (ready || typeof window === "undefined") return;
      posthog.init(key, {
        api_host: host || "https://us.i.posthog.com",
        person_profiles: "identified_only",
        capture_pageview: false,
        capture_pageleave: true,
        persistence: "localStorage+cookie",
      });
      ready = true;
    },

    track(event, properties) {
      if (!ready) return;
      posthog.capture(event, properties);
    },

    identify(userId, traits) {
      if (!ready) return;
      posthog.identify(userId, traits);
    },

    reset() {
      if (!ready) return;
      posthog.reset();
    },

    pageview(url, properties) {
      if (!ready) return;
      posthog.capture("$pageview", { $current_url: url, ...properties });
    },
  };
}
