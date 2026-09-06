/**
 * Web originality vendor interface.
 * No-op until COPYLEAKS_* (or similar) env is configured.
 */

export type WebOriginalityProviderResult = {
  kind: "web";
  status: "ok" | "premium_required" | "coming_soon" | "error" | "disabled";
  message: string;
  matches?: Array<{ url: string; score: number; excerpt?: string }>;
  upgradeUrl?: string;
};

export interface WebOriginalityProvider {
  readonly id: string;
  isConfigured(): boolean;
  scan(userId: string, text: string): Promise<WebOriginalityProviderResult>;
}

/** Default stub — preserves current Premium / coming_soon messaging. */
export class NoopWebOriginalityProvider implements WebOriginalityProvider {
  readonly id = "noop";

  isConfigured(): boolean {
    return false;
  }

  async scan(
    _userId: string,
    _text: string
  ): Promise<WebOriginalityProviderResult> {
    return {
      kind: "web",
      status: "coming_soon",
      message:
        "Web originality (public-web match) is reserved for Premium. No third-party scan is wired yet — use library and syllabus checks for now.",
    };
  }
}

/**
 * Copyleaks-shaped adapter. Active only when COPYLEAKS_API_KEY is set.
 * Does not call the network until fully implemented behind the flag.
 */
export class CopyleaksWebOriginalityProvider implements WebOriginalityProvider {
  readonly id = "copyleaks";

  isConfigured(): boolean {
    return Boolean(process.env.COPYLEAKS_API_KEY?.trim());
  }

  async scan(
    _userId: string,
    _text: string
  ): Promise<WebOriginalityProviderResult> {
    if (!this.isConfigured()) {
      return new NoopWebOriginalityProvider().scan(_userId, _text);
    }
    // Vendor HTTP wiring deferred — keep behavior identical to stub until ready.
    return {
      kind: "web",
      status: "coming_soon",
      message:
        "Copyleaks credentials are present but the scan path is not enabled yet.",
    };
  }
}

let cached: WebOriginalityProvider | null = null;

export function getWebOriginalityProvider(): WebOriginalityProvider {
  if (cached) return cached;
  const copyleaks = new CopyleaksWebOriginalityProvider();
  cached = copyleaks.isConfigured()
    ? copyleaks
    : new NoopWebOriginalityProvider();
  return cached;
}
