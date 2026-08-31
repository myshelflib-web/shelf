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
        capture_exceptions: true,
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

    captureException(error, properties) {
      if (!ready) return;
      const ph = posthog as typeof posthog & {
        captureException?: (err: Error, opts?: object) => void;
      };
      if (typeof ph.captureException === "function") {
        ph.captureException(error, { additionalProperties: properties });
        return;
      }
      posthog.capture("$exception", {
        $exception_message: error.message,
        $exception_type: error.name,
        $exception_stack_trace: error.stack,
        ...properties,
      });
    },
  };
}
