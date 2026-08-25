"use client";

import { Share, X } from "lucide-react";
import { useEffect, useState } from "react";

const DISMISS_KEY = "shelf:pwa-install-hint-dismissed";

function isIosDevice() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const ipad =
    /iPad/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  return ipad || /iPhone|iPod/.test(ua);
}

function isStandaloneDisplay() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && (navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}

export function PwaInstallHint() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isIosDevice() || isStandaloneDisplay()) return;
    if (window.localStorage.getItem(DISMISS_KEY) === "1") return;
    setVisible(true);
  }, []);

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[80] flex justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="pointer-events-auto flex max-w-md items-start gap-3 rounded-[10px] border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 shadow-lg">
        <Share className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" aria-hidden />
        <div className="min-w-0 flex-1 text-left">
          <p className="text-sm font-medium text-[var(--text-primary)]">Install Shelf on iPad</p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
            Tap Share, then{" "}
            <span className="font-medium text-[var(--text-primary)]">Add to Home Screen</span>{" "}
            for a full-screen app with no browser bar.
          </p>
        </div>
        <button
          type="button"
          aria-label="Dismiss install hint"
          className="shrink-0 rounded-md p-1 text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
          onClick={() => {
            window.localStorage.setItem(DISMISS_KEY, "1");
            setVisible(false);
          }}
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
