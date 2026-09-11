"use client";

import { BrokenShelfIcon } from "@/components/BrokenShelfIcon";
import { LEGAL_CONTACT_EMAIL } from "@/lib/legal/types";

function isChunkLoadError(error: Error | undefined): boolean {
  if (!error) return false;
  const name = error.name || "";
  const msg = error.message || "";
  return (
    name === "ChunkLoadError" ||
    /Loading chunk .+ failed/i.test(msg) ||
    /Failed to fetch dynamically imported module/i.test(msg) ||
    /error loading dynamically imported module/i.test(msg)
  );
}

export function AppErrorFallback({
  error,
  onRetry,
  fullScreen = false,
}: {
  error?: Error;
  onRetry?: () => void;
  /** Fill the viewport (route / global errors). */
  fullScreen?: boolean;
}) {
  const chunk = isChunkLoadError(error);
  const title = chunk ? "Shelf couldn’t load this page" : "Something went wrong";
  const body = chunk
    ? "A piece of the app failed to download. Try again — if it keeps happening, contact support."
    : "This part of Shelf hit an unexpected problem. Try again, or contact support if it continues.";

  const retry = () => {
    if (onRetry) {
      onRetry();
      return;
    }
    window.location.reload();
  };

  const supportHref = `mailto:${LEGAL_CONTACT_EMAIL}?subject=${encodeURIComponent(
    "Shelf support — app error"
  )}`;

  return (
    <div
      className={
        fullScreen
          ? "min-h-full h-full flex flex-col items-center justify-center px-6 py-16 text-center bg-[var(--bg-primary)] text-[var(--text-primary)]"
          : "flex min-h-[40vh] flex-col items-center justify-center gap-1 px-6 py-16 text-center"
      }
      role="alert"
    >
      <BrokenShelfIcon size={fullScreen ? 88 : 72} className="mb-5" />
      <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[var(--text-primary)]">
        {title}
      </h1>
      <p className="mt-2 max-w-sm text-[15px] leading-relaxed text-[var(--text-secondary)]">
        {body}
      </p>
      <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
        <button
          type="button"
          onClick={retry}
          className="min-h-11 rounded-[10px] bg-[var(--accent)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--accent-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)]"
        >
          Try again
        </button>
        <a
          href={supportHref}
          className="min-h-11 inline-flex items-center justify-center rounded-[10px] border border-[var(--border)] bg-[var(--bg-secondary)] px-5 py-2.5 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)]"
        >
          Contact support
        </a>
      </div>
      <p className="mt-4 text-xs text-[var(--text-muted)]">
        <a
          href={supportHref}
          className="underline underline-offset-2 hover:text-[var(--text-secondary)]"
        >
          {LEGAL_CONTACT_EMAIL}
        </a>
      </p>
    </div>
  );
}
