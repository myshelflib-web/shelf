import { sanitizeSecret } from "../llmConfig.js";

export const SARVAM_DEFAULT_BASE_URL = "https://api.sarvam.ai/v1";
export const SARVAM_DEFAULT_MODEL = "sarvam-105b";

export function sarvamApiKey(): string {
  return sanitizeSecret(process.env.SARVAM_API_KEY) ?? "";
}

export function sarvamBaseUrl(): string {
  const raw = sanitizeSecret(process.env.SARVAM_BASE_URL);
  return (raw || SARVAM_DEFAULT_BASE_URL).replace(/\/+$/, "");
}

export function sarvamModel(): string {
  return sanitizeSecret(process.env.SARVAM_MODEL) || SARVAM_DEFAULT_MODEL;
}

export function sarvamMaxOutputTokens(): number {
  const raw = Number(process.env.SARVAM_MAX_OUTPUT_TOKENS);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 16_000;
}

export function sarvamConfigured(): boolean {
  return sarvamApiKey().length > 0;
}

export function sarvamConfigSummary(): {
  configured: boolean;
  baseUrl: string;
  model: string;
  maxOutputTokens: number;
} {
  return {
    configured: sarvamConfigured(),
    baseUrl: sarvamBaseUrl(),
    model: sarvamModel(),
    maxOutputTokens: sarvamMaxOutputTokens(),
  };
}
