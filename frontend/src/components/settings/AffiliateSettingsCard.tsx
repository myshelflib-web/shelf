"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatCoinsAsInr } from "@/lib/affiliateRef";
import { Check, Copy, Link2 } from "lucide-react";

export function AffiliateSettingsCard() {
  const [data, setData] = useState<{
    code: string;
    coinBalance: number;
    commissionPercent: number;
    attributionDays: number;
    totalEarnedCoins: number;
    referralCount: number;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.affiliate
      .me()
      .then(setData)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Could not load affiliate")
      );
  }, []);

  const link =
    typeof window !== "undefined" && data
      ? `${window.location.origin}/subscribe?ref=${data.code}`
      : "";

  const copy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("Could not copy link");
    }
  };

  return (
    <section className="p-5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] space-y-3">
      <div className="flex items-center gap-2">
        <Link2 className="w-4 h-4 text-[var(--accent)]" />
        <h2 className="text-sm font-semibold">Affiliate</h2>
      </div>
      <p className="text-xs text-[var(--text-muted)]">
        Share your link. When someone upgrades, you earn{" "}
        {data ? `${data.commissionPercent}%` : "10%"} as Shelf coins you can
        apply toward your own Premium renewals.
      </p>
      {error && <p className="text-sm text-red-500">{error}</p>}
      {!data ? (
        <p className="text-sm text-[var(--text-muted)]">Loading…</p>
      ) : (
        <>
          <div className="flex gap-2">
            <input
              readOnly
              value={link}
              className="flex-1 min-w-0 px-3 py-2 text-xs rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] font-mono"
            />
            <button
              type="button"
              onClick={copy}
              className="btn-secondary shrink-0 px-3"
              aria-label="Copy affiliate link"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-[var(--text-muted)] text-xs">Coin credit</p>
              <p className="font-medium">{formatCoinsAsInr(data.coinBalance)}</p>
            </div>
            <div>
              <p className="text-[var(--text-muted)] text-xs">Earned · referrals</p>
              <p className="font-medium">
                {formatCoinsAsInr(data.totalEarnedCoins)} · {data.referralCount}
              </p>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
