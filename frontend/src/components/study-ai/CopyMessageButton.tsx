"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyMessageButton({
  text,
  variant = "link",
}: {
  text: string;
  variant?: "link" | "action";
}) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
    };
  }, []);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }, [text]);

  const actionClass =
    "inline-flex items-center gap-1.5 h-[29px] px-2 rounded-[7px] text-[10px] text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors";
  const linkClass =
    "inline-flex items-center gap-1 text-[11px] text-[var(--accent)] hover:underline";

  return (
    <button
      type="button"
      className={variant === "action" ? actionClass : linkClass}
      onClick={() => void copy()}
      aria-label={copied ? "Copied to clipboard" : "Copy to clipboard"}
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
