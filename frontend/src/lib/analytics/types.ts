/** Vendor-agnostic analytics surface — swap providers without touching call sites. */

export type AnalyticsProperties = Record<
  string,
  string | number | boolean | null | undefined
>;

export interface AnalyticsUserTraits extends AnalyticsProperties {
  email?: string;
  name?: string;
  plan?: string;
  studyGoal?: string;
  role?: string;
}

export interface AnalyticsProvider {
  init(): void;
  track(event: string, properties?: AnalyticsProperties): void;
  identify(userId: string, traits?: AnalyticsUserTraits): void;
  reset(): void;
  pageview(url: string, properties?: AnalyticsProperties): void;
  captureException?(error: Error, properties?: AnalyticsProperties): void;
}

export interface AnalyticsConfig {
  vendor: string;
  key: string;
  host?: string;
}
