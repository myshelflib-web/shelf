import type { AnalyticsConfig } from "./types";

/** Read public env — vendor-agnostic names so swapping tools is a config change. */
export function readAnalyticsConfig(): AnalyticsConfig | null {
  const key = (
    process.env.NEXT_PUBLIC_ANALYTICS_KEY ??
    process.env.NEXT_PUBLIC_POSTHOG_KEY ??
    ""
  ).trim();
  if (!key) return null;

  const host = (
    process.env.NEXT_PUBLIC_ANALYTICS_HOST ??
    process.env.NEXT_PUBLIC_POSTHOG_HOST ??
    ""
  ).trim();

  const vendor = (
    process.env.NEXT_PUBLIC_ANALYTICS_VENDOR ?? "posthog"
  ).trim().toLowerCase();

  return { vendor, key, host: host || undefined };
}
