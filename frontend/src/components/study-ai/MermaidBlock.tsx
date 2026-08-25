"use client";

import { useEffect, useId, useRef, useState } from "react";

function isDarkTheme(): boolean {
  if (typeof document === "undefined") return true;
  return document.documentElement.classList.contains("dark");
}

/** Renders a Mermaid chart; falls back to the source fence if parse fails (e.g. mid-stream). */
export function MermaidBlock({ chart }: { chart: string }) {
  const reactId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const hostRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const source = chart.trim();

  useEffect(() => {
    if (!source) return;
    let cancelled = false;
    setFailed(false);

    void (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: isDarkTheme() ? "dark" : "default",
          fontFamily: "var(--font-sans), system-ui, sans-serif",
        });
        const { svg } = await mermaid.render(`shelf-mmd-${reactId}`, source);
        if (cancelled || !hostRef.current) return;
        hostRef.current.innerHTML = svg;
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [source, reactId]);

  if (failed) {
    return (
      <pre className="study-ai-code-block">
        <code>{source}</code>
      </pre>
    );
  }

  return (
    <div
      ref={hostRef}
      className="study-ai-mermaid"
      aria-label="Mermaid diagram"
    />
  );
}
