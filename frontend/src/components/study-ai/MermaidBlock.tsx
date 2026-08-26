"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Maximize2, X } from "lucide-react";

function isDarkTheme(): boolean {
  if (typeof document === "undefined") return true;
  return document.documentElement.classList.contains("dark");
}

/** Renders a Mermaid chart; click opens a larger preview. Falls back to source if parse fails. */
export function MermaidBlock({
  chart,
  previewable = true,
}: {
  chart: string;
  previewable?: boolean;
}) {
  const reactId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const hostRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const [svg, setSvg] = useState("");
  const [open, setOpen] = useState(false);
  const source = chart.trim();

  useEffect(() => {
    if (!source) return;
    let cancelled = false;
    setFailed(false);
    setSvg("");

    void (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: isDarkTheme() ? "dark" : "default",
          fontFamily: "var(--font-sans), system-ui, sans-serif",
        });
        const { svg: rendered } = await mermaid.render(
          `shelf-mmd-${reactId}`,
          source
        );
        if (cancelled || !hostRef.current) return;
        hostRef.current.innerHTML = rendered;
        setSvg(rendered);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [source, reactId]);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  if (failed) {
    return (
      <pre className="study-ai-code-block">
        <code>{source}</code>
      </pre>
    );
  }

  return (
    <>
      <div className="study-ai-mermaid-wrap relative group">
        <div
          ref={hostRef}
          className="study-ai-mermaid"
          aria-label="Mermaid diagram"
        />
        {previewable && svg && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="absolute top-2 right-2 h-7 px-2 rounded-md text-[10px] font-semibold inline-flex items-center gap-1 bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-secondary)] opacity-0 group-hover:opacity-100 focus:opacity-100 hover:border-[var(--accent)] hover:text-[var(--accent)]"
            aria-label="Open diagram preview"
          >
            <Maximize2 className="w-3 h-3" />
            Preview
          </button>
        )}
      </div>
      {open && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 p-4 sm:p-8"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label="Diagram preview"
        >
          <div
            className="relative w-full max-w-5xl max-h-[90vh] overflow-auto rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close preview"
              onClick={close}
              className="absolute top-3 right-3 w-8 h-8 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
            >
              <X className="w-4 h-4 mx-auto" />
            </button>
            <div
              className="study-ai-mermaid study-ai-mermaid-preview pr-8"
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          </div>
        </div>
      )}
    </>
  );
}
