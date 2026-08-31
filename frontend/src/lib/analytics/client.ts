import type { User } from "@/types";
import { readAnalyticsConfig } from "./config";
import { createNoopProvider } from "./providers/noop";
import { createPostHogProvider } from "./providers/posthog";
import type {
  AnalyticsProperties,
  AnalyticsProvider,
  AnalyticsUserTraits,
} from "./types";
import type { AnalyticsEventName } from "./events";

let provider: AnalyticsProvider = createNoopProvider();
let initialized = false;

function resolveProvider(config: NonNullable<ReturnType<typeof readAnalyticsConfig>>) {
  switch (config.vendor) {
    case "posthog":
      return createPostHogProvider(config.key, config.host);
    default:
      console.warn(
        `[analytics] Unknown vendor "${config.vendor}" — events will not be sent.`
      );
      return createNoopProvider();
  }
}

export function initAnalytics(): void {
  if (initialized || typeof window === "undefined") return;
  const config = readAnalyticsConfig();
  provider = config ? resolveProvider(config) : createNoopProvider();
  provider.init();
  initialized = true;
}

export function isAnalyticsEnabled(): boolean {
  return Boolean(readAnalyticsConfig());
}

export function track(
  event: AnalyticsEventName | string,
  properties?: AnalyticsProperties
): void {
  if (!initialized) initAnalytics();
  provider.track(event, properties);
}

export function identifyUser(
  userId: string,
  traits?: AnalyticsUserTraits
): void {
  if (!initialized) initAnalytics();
  provider.identify(userId, traits);
}

export function identifyFromUser(user: User): void {
  identifyUser(user.id, {
    email: user.email,
    name: user.name,
    plan: user.plan,
    studyGoal: user.studyGoal,
    role: user.role,
  });
}

export function resetAnalytics(): void {
  if (!initialized) return;
  provider.reset();
}

export function pageview(
  url: string,
  properties?: AnalyticsProperties
): void {
  if (!initialized) initAnalytics();
  provider.pageview(url, properties);
}

export function captureException(
  error: Error,
  properties?: AnalyticsProperties
): void {
  if (!initialized) initAnalytics();
  provider.captureException?.(error, properties);
}

/** Test hook — not used in production UI */
export function __setAnalyticsProviderForTests(next: AnalyticsProvider): void {
  provider = next;
  initialized = true;
}
