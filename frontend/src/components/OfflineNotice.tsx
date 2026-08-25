"use client";

import { useEffect, useState } from "react";
import { CloudOff, X } from "lucide-react";
import { OFFLINE_NOTICE_EVENT, offlineFeatureMessage } from "@/lib/offline/notice";

export function OfflineNotice() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const onNotice = (event: Event) => {
      const feature = (event as CustomEvent<{ feature?: string | null }>).detail?.feature;
      setMessage(offlineFeatureMessage(feature ?? undefined));
      window.setTimeout(() => setMessage(null), 4500);
    };
    window.addEventListener(OFFLINE_NOTICE_EVENT, onNotice);
    return () => window.removeEventListener(OFFLINE_NOTICE_EVENT, onNotice);
  }, []);

  if (!message) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-14 z-[85] flex justify-center px-4">
      <div className="pointer-events-auto flex max-w-md items-start gap-2 rounded-[10px] border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2.5 shadow-lg">
        <CloudOff className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" aria-hidden />
        <p className="min-w-0 flex-1 text-left text-xs leading-relaxed text-[var(--text-secondary)]">
          {message}
        </p>
        <button
          type="button"
          aria-label="Dismiss"
          className="shrink-0 rounded-md p-1 text-[var(--text-muted)] hover:bg-[var(--bg-secondary)]"
          onClick={() => setMessage(null)}
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>
    </div>
  );
}
