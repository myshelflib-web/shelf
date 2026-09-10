"use client";

import Link from "next/link";
import { LogIn, UserPlus } from "lucide-react";

/**
 * Floating Sign in / Create account bar for guests.
 * Matches the landing sticky CTA shape and size (rounded pills in a frosted tray).
 */
export function GuestAuthStickyBar({ returnTo }: { returnTo: string }) {
  const next = encodeURIComponent(returnTo);
  const loginHref = `/login?next=${next}`;
  const registerHref = `/login?register=1&next=${next}`;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-3 z-20 flex justify-center px-3">
      <div className="pointer-events-auto flex items-center gap-2 px-2.5 py-2 rounded-[999px] border border-[var(--border)] bg-[color-mix(in_srgb,var(--bg-elevated)_92%,transparent)] backdrop-blur-md shadow-[0_12px_36px_rgba(0,0,0,0.14)] max-w-full">
        <Link
          href={registerHref}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full px-3.5 text-[12px] font-semibold whitespace-nowrap bg-[var(--accent)] border border-[var(--accent)] text-white shadow-[0_12px_28px_rgba(98,91,196,0.22)] hover:bg-[var(--accent-hover)] transition-colors"
        >
          <UserPlus className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden />
          Create account
        </Link>
        <Link
          href={loginHref}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full px-3.5 text-[12px] font-semibold whitespace-nowrap border border-[var(--border)] bg-transparent text-[var(--text-primary)] hover:border-[var(--text-muted)] transition-colors"
        >
          <LogIn className="w-3.5 h-3.5" strokeWidth={1.75} aria-hidden />
          Sign in
        </Link>
      </div>
    </div>
  );
}
