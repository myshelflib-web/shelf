/**
 * Sarvam list pricing in INR per 1M tokens.
 * Source: https://docs.sarvam.ai/api/getting-started/pricing
 * Override per deployment with SARVAM_INPUT_INR_PER_MTOK / SARVAM_OUTPUT_INR_PER_MTOK.
 */
const DEFAULT_INPUT_INR_PER_MTOK = 29.28;
const DEFAULT_OUTPUT_INR_PER_MTOK = 73.2;

function envRate(name: string, fallback: number): number {
  const raw = Number(process.env[name]);
  return Number.isFinite(raw) && raw >= 0 ? raw : fallback;
}

export function sarvamInputRate(): number {
  return envRate("SARVAM_INPUT_INR_PER_MTOK", DEFAULT_INPUT_INR_PER_MTOK);
}

export function sarvamOutputRate(): number {
  return envRate("SARVAM_OUTPUT_INR_PER_MTOK", DEFAULT_OUTPUT_INR_PER_MTOK);
}

export function estimateCostInr(inputTokens: number, outputTokens: number): number {
  const input = (Math.max(0, inputTokens) / 1_000_000) * sarvamInputRate();
  const output = (Math.max(0, outputTokens) / 1_000_000) * sarvamOutputRate();
  return input + output;
}

/** Cost in paise so it can be stored as an integer without float drift. */
export function estimateCostPaise(inputTokens: number, outputTokens: number): number {
  return Math.round(estimateCostInr(inputTokens, outputTokens) * 100);
}

export function formatInr(paise: number): string {
  return `₹${(paise / 100).toFixed(2)}`;
}
