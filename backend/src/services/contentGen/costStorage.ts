import {
  estimateCostPaise,
  sarvamInputRate,
  sarvamOutputRate,
} from "../sarvam/sarvamPricing.js";

/**
 * Draft + recheck + one revision + recheck for an 1800–2400 word page
 * with tables and a diagram.
 */
export const TOKENS_PER_PAGE = { input: 16_000, output: 11_000 } as const;

/** Typical stored artefacts: HTML reader page + plain-text source. */
export const BYTES_HTML_PER_PAGE = 48_000;
export const BYTES_TEXT_PER_PAGE = 16_000;
export const BYTES_PER_PAGE = BYTES_HTML_PER_PAGE + BYTES_TEXT_PER_PAGE;

export function costPaiseForPages(pages: number): number {
  const n = Math.max(0, pages);
  return estimateCostPaise(
    n * TOKENS_PER_PAGE.input,
    n * TOKENS_PER_PAGE.output
  );
}

export function bytesForPages(pages: number): number {
  return Math.max(0, pages) * BYTES_PER_PAGE;
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000_000) return `${(bytes / 1_000_000_000).toFixed(2)} GB`;
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(0)} KB`;
  return `${bytes} B`;
}

export function perPageCostPaise(): number {
  return estimateCostPaise(TOKENS_PER_PAGE.input, TOKENS_PER_PAGE.output);
}

export function pricingRates() {
  return {
    inputInrPerMtok: sarvamInputRate(),
    outputInrPerMtok: sarvamOutputRate(),
    tokensPerPage: TOKENS_PER_PAGE,
    bytesPerPage: BYTES_PER_PAGE,
    perPageCostPaise: perPageCostPaise(),
  };
}
