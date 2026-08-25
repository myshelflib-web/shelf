"use client";

import { useEffect } from "react";
import Link from "next/link";
import { LogIn, X } from "lucide-react";

export function SignInPromptModal({
  feature,
  returnTo,
  onClose,
}: {
  feature: string;
  returnTo: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const loginHref = `/login?next=${encodeURIComponent(returnTo)}`;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sign-in-prompt-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-[10px] border border-[var(--border)] bg-[var(--bg-elevated)] shadow-xl p-6">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="flex items-start gap-3 pr-8">
          <div className="w-10 h-10 rounded-lg bg-[var(--accent-subtle)] flex items-center justify-center shrink-0">
            <LogIn className="w-5 h-5 text-[var(--accent)]" />
          </div>
          <div>
            <h2
              id="sign-in-prompt-title"
              className="text-lg font-semibold text-[var(--text-primary)]"
            >
              Sign in to continue
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1.5">
              {feature} requires an account. Sign in to save progress,
              highlights, and Study AI across devices.
            </p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-2 justify-end">
          <button type="button" onClick={onClose} className="btn-secondary text-sm py-2">
            Keep reading
          </button>
          <Link href={loginHref} className="btn-primary text-sm py-2 inline-flex">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
