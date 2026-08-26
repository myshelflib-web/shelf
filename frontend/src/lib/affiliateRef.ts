/** Persist affiliate ref from ?ref=CODE for attribution window. */
const REF_KEY = "shelf:affiliate-ref";

export type StoredAffiliateRef = {
  code: string;
  capturedAt: number;
};

export function captureAffiliateRefFromSearch(search: string): string | null {
  const params = new URLSearchParams(search);
  const code = params.get("ref")?.trim().toUpperCase();
  if (!code) return null;
  try {
    localStorage.setItem(
      REF_KEY,
      JSON.stringify({ code, capturedAt: Date.now() } satisfies StoredAffiliateRef)
    );
  } catch {
    /* ignore */
  }
  return code;
}

export function getStoredAffiliateRef(maxAgeDays = 30): string | null {
  try {
    const raw = localStorage.getItem(REF_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredAffiliateRef;
    if (!parsed?.code) return null;
    const maxMs = maxAgeDays * 24 * 60 * 60 * 1000;
    if (Date.now() - parsed.capturedAt > maxMs) {
      localStorage.removeItem(REF_KEY);
      return null;
    }
    return parsed.code;
  } catch {
    return null;
  }
}

export function formatCoinsAsInr(coinsPaise: number): string {
  return `₹${(Math.max(0, coinsPaise) / 100).toFixed(2)}`;
}
