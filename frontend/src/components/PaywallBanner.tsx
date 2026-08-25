"use client";

import Link from "next/link";
import { Lock, Sparkles } from "lucide-react";

interface PaywallBannerProps {
  previewPercent: number;
  priceInr?: number;
}

export function PaywallBanner({ previewPercent, priceInr = 999 }: PaywallBannerProps) {
  return (
    <div className="mx-8 mb-6 -mt-2">
      <div className="relative rounded-xl border border-[var(--accent)]/30 bg-gradient-to-b from-[var(--accent-light)] to-[var(--bg-secondary)] p-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-[var(--bg-primary)]/40 backdrop-blur-[1px]" />
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-[var(--accent)]/20 flex items-center justify-center mx-auto mb-3">
            <Lock className="w-6 h-6 text-[var(--accent)]" />
          </div>
          <h3 className="text-lg font-semibold mb-1">Premium Article</h3>
          <p className="text-sm text-[var(--text-secondary)] mb-4 max-w-md mx-auto">
            You&apos;re reading a {previewPercent}% preview. Upgrade to unlock the
            full article and all premium library content.
          </p>
          <Link
            href="/subscribe"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[var(--accent)] text-white font-medium hover:bg-[var(--accent-hover)] transition"
          >
            <Sparkles className="w-4 h-4" />
            Upgrade — ₹{priceInr}/year
          </Link>
        </div>
      </div>
    </div>
  );
}
