/**
 * Minimal Copyleaks Authenticity API client (login + submit file).
 * Results arrive via webhook — see routes/copyleaksWebhook.ts.
 */

import { randomUUID } from "crypto";
import { fetchWithTimeout } from "../utils/timeout.js";

const LOGIN_URL = "https://id.copyleaks.com/v3/account/login/api";
const SUBMIT_BASE = "https://api.copyleaks.com/v3/scans/submit/file";

type TokenCache = { token: string; expiresAt: number };
let tokenCache: TokenCache | null = null;

export function copyleaksEnvConfigured(): boolean {
  return Boolean(
    process.env.COPYLEAKS_EMAIL?.trim() && process.env.COPYLEAKS_API_KEY?.trim()
  );
}

export function copyleaksWebhookBase(): string | null {
  const raw =
    process.env.COPYLEAKS_WEBHOOK_BASE_URL?.trim() ||
    process.env.PUBLIC_API_URL?.trim() ||
    "";
  if (!raw) return null;
  return raw.replace(/\/+$/, "");
}

export function copyleaksSandbox(): boolean {
  const v = (process.env.COPYLEAKS_SANDBOX ?? "1").trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

export async function copyleaksLogin(): Promise<string> {
  const email = process.env.COPYLEAKS_EMAIL?.trim();
  const key = process.env.COPYLEAKS_API_KEY?.trim();
  if (!email || !key) {
    throw new Error("COPYLEAKS_EMAIL and COPYLEAKS_API_KEY are required");
  }
  const now = Date.now();
  if (tokenCache && tokenCache.expiresAt > now + 60_000) {
    return tokenCache.token;
  }
  const res = await fetchWithTimeout(LOGIN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, key }),
    timeoutMs: 20_000,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Copyleaks login failed (${res.status}): ${body.slice(0, 200)}`);
  }
  const data = (await res.json()) as { access_token?: string; ".issued"?: string };
  const token = data.access_token;
  if (!token) throw new Error("Copyleaks login returned no access_token");
  // Tokens last ~48h; refresh hourly-ish.
  tokenCache = { token, expiresAt: now + 40 * 60 * 60 * 1000 };
  return token;
}

export function newCopyleaksScanId(): string {
  return randomUUID().replace(/-/g, "").slice(0, 36);
}

export async function copyleaksSubmitText(opts: {
  scanId: string;
  text: string;
  webhookStatusUrl: string;
}): Promise<void> {
  const token = await copyleaksLogin();
  const base64 = Buffer.from(opts.text, "utf8").toString("base64");
  const res = await fetchWithTimeout(`${SUBMIT_BASE}/${opts.scanId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      base64,
      filename: "shelf-originality.txt",
      properties: {
        sandbox: copyleaksSandbox(),
        webhooks: {
          status: opts.webhookStatusUrl,
        },
        author: "shelf",
      },
    }),
    timeoutMs: 30_000,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Copyleaks submit failed (${res.status}): ${body.slice(0, 280)}`
    );
  }
}

/** Parse Copyleaks completed webhook JSON into match list + score. */
export function parseCopyleaksCompletedPayload(raw: unknown): {
  scorePercent: number | null;
  matches: Array<{ url: string; score: number; excerpt?: string }>;
} {
  const body = raw as {
    results?: {
      score?: { aggregatedScore?: number; identicalWords?: number };
      internet?: Array<{
        url?: string;
        title?: string;
        introduction?: string;
        matchedWords?: number;
      }>;
      database?: Array<{
        url?: string;
        title?: string;
        introduction?: string;
        matchedWords?: number;
      }>;
    };
    scannedDocument?: { totalWords?: number };
  };
  const scorePercent =
    typeof body.results?.score?.aggregatedScore === "number"
      ? body.results.score.aggregatedScore
      : null;
  const totalWords = Math.max(1, body.scannedDocument?.totalWords ?? 1);
  const rows = [
    ...(body.results?.internet || []),
    ...(body.results?.database || []),
  ];
  const matches = rows
    .map((r) => {
      const url = (r.url || "").trim();
      if (!url) return null;
      const matched = r.matchedWords ?? 0;
      const score = Math.min(1, matched / totalWords);
      return {
        url,
        score: Math.round(score * 1000) / 1000,
        excerpt: (r.introduction || r.title || "").trim() || undefined,
      };
    })
    .filter(Boolean) as Array<{ url: string; score: number; excerpt?: string }>;
  matches.sort((a, b) => b.score - a.score);
  return { scorePercent, matches: matches.slice(0, 12) };
}
