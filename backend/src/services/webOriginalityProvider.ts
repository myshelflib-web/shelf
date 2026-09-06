/**
 * Web originality vendor interface + Copyleaks adapter.
 * Inactive until COPYLEAKS_EMAIL + COPYLEAKS_API_KEY (+ webhook base) are set.
 */

import {
  copyleaksEnvConfigured,
  copyleaksSubmitText,
  copyleaksWebhookBase,
  newCopyleaksScanId,
  parseCopyleaksCompletedPayload,
} from "./copyleaksClient.js";

export type WebOriginalityProviderResult = {
  kind: "web";
  status: "ok" | "premium_required" | "coming_soon" | "error" | "pending";
  message: string;
  matches?: Array<{ url: string; score: number; excerpt?: string }>;
  scorePercent?: number | null;
  scanId?: string;
  upgradeUrl?: string;
};

export interface WebOriginalityProvider {
  readonly id: string;
  isConfigured(): boolean;
  scan(userId: string, text: string): Promise<WebOriginalityProviderResult>;
}

type ScanRecord = {
  userId: string;
  status: "pending" | "ok" | "error";
  result?: WebOriginalityProviderResult;
  createdAt: number;
};

const scans = new Map<string, ScanRecord>();
const SCAN_TTL_MS = 30 * 60 * 1000;

function pruneScans() {
  const cutoff = Date.now() - SCAN_TTL_MS;
  for (const [id, row] of scans) {
    if (row.createdAt < cutoff) scans.delete(id);
  }
}

export function rememberPendingScan(scanId: string, userId: string) {
  pruneScans();
  scans.set(scanId, { userId, status: "pending", createdAt: Date.now() });
}

export function completeScanFromWebhook(
  scanId: string,
  status: string,
  payload: unknown
): void {
  pruneScans();
  const row = scans.get(scanId);
  if (!row) {
    scans.set(scanId, {
      userId: "",
      status: status === "completed" || status === "Completed" ? "ok" : "error",
      createdAt: Date.now(),
      result: undefined,
    });
  }
  const current = scans.get(scanId)!;
  if (status.toLowerCase() === "error" || status.toLowerCase() === "failed") {
    current.status = "error";
    current.result = {
      kind: "web",
      status: "error",
      message: "Web originality scan failed at the vendor.",
      scanId,
    };
    return;
  }
  if (status.toLowerCase() !== "completed") return;
  const parsed = parseCopyleaksCompletedPayload(payload);
  current.status = "ok";
  current.result = {
    kind: "web",
    status: "ok",
    scanId,
    scorePercent: parsed.scorePercent,
    matches: parsed.matches,
    message:
      parsed.matches.length === 0
        ? parsed.scorePercent != null
          ? `No strong public-web matches (aggregate score ${Math.round(parsed.scorePercent)}%).`
          : "No strong public-web matches reported."
        : `Found ${parsed.matches.length} possible web overlap${
            parsed.matches.length === 1 ? "" : "s"
          }${
            parsed.scorePercent != null
              ? ` (aggregate ${Math.round(parsed.scorePercent)}%)`
              : ""
          }.`,
  };
}

export function getScanResult(
  scanId: string
): WebOriginalityProviderResult | null {
  pruneScans();
  const row = scans.get(scanId);
  if (!row) return null;
  if (row.status === "pending") {
    return {
      kind: "web",
      status: "pending",
      message: "Web scan still running…",
      scanId,
    };
  }
  return (
    row.result || {
      kind: "web",
      status: "error",
      message: "Scan finished without a result payload.",
      scanId,
    }
  );
}

async function waitForScan(
  scanId: string,
  timeoutMs: number
): Promise<WebOriginalityProviderResult | null> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const row = scans.get(scanId);
    if (row && row.status !== "pending") {
      return getScanResult(scanId);
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  return getScanResult(scanId);
}

/** Default stub — Premium messaging when vendor keys are unset. */
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
        "Web originality (public-web match) needs a plagiarism vendor. Add COPYLEAKS_EMAIL and COPYLEAKS_API_KEY to enable — use library and syllabus checks for now.",
    };
  }
}

/**
 * Copyleaks Authenticity adapter.
 * Requires COPYLEAKS_EMAIL + COPYLEAKS_API_KEY and a public webhook base URL.
 */
export class CopyleaksWebOriginalityProvider implements WebOriginalityProvider {
  readonly id = "copyleaks";

  isConfigured(): boolean {
    return copyleaksEnvConfigured();
  }

  async scan(
    userId: string,
    text: string
  ): Promise<WebOriginalityProviderResult> {
    if (!this.isConfigured()) {
      return new NoopWebOriginalityProvider().scan(userId, text);
    }
    const webhookBase = copyleaksWebhookBase();
    if (!webhookBase) {
      return {
        kind: "web",
        status: "error",
        message:
          "Copyleaks keys are set, but COPYLEAKS_WEBHOOK_BASE_URL (or PUBLIC_API_URL) is missing. Copyleaks posts results to your API — set the public origin, e.g. https://api.yoursite.com",
      };
    }

    const source = text.trim().slice(0, 50_000);
    if (source.length < 24) {
      return {
        kind: "web",
        status: "error",
        message: "Text is too short for a web originality scan.",
      };
    }

    const scanId = newCopyleaksScanId();
    rememberPendingScan(scanId, userId);
    // Copyleaks replaces {STATUS} with completed | error | creditsChecked.
    const webhookStatusUrl = `${webhookBase}/api/webhooks/copyleaks/{STATUS}/${scanId}`;

    try {
      await copyleaksSubmitText({
        scanId,
        text: source,
        webhookStatusUrl,
      });
    } catch (err) {
      return {
        kind: "web",
        status: "error",
        message:
          err instanceof Error
            ? err.message
            : "Failed to submit web originality scan.",
        scanId,
      };
    }

    const waitMs = Number(process.env.COPYLEAKS_WAIT_MS ?? 12_000);
    const finished = await waitForScan(scanId, Math.max(2_000, waitMs));
    if (finished && finished.status !== "pending") return finished;
    return {
      kind: "web",
      status: "pending",
      message:
        "Web scan submitted. Results usually arrive within a minute — re-check shortly.",
      scanId,
    };
  }
}

let cached: WebOriginalityProvider | null = null;

/** Test helper — clears provider + scan cache. */
export function resetWebOriginalityProviderForTests() {
  cached = null;
  scans.clear();
}

export function getWebOriginalityProvider(): WebOriginalityProvider {
  if (cached) return cached;
  const copyleaks = new CopyleaksWebOriginalityProvider();
  cached = copyleaks.isConfigured()
    ? copyleaks
    : new NoopWebOriginalityProvider();
  return cached;
}
