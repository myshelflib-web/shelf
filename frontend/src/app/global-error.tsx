"use client";

import { useEffect } from "react";
import { AppErrorFallback } from "@/components/AppErrorFallback";
import { captureComponentError } from "@/lib/analytics/errors";

/**
 * Last-resort UI when the root layout itself fails.
 * Must define html/body; imports globals so design tokens apply.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureComponentError(error, error.digest);
  }, [error]);

  return (
    <html lang="en-IN" className="dark h-full">
      <body className="h-full antialiased bg-[var(--bg-primary,#0c0c0d)] text-[var(--text-primary,#f2f2f3)]">
        {/* Inline critical tokens if CSS chunk also failed to load */}
        <style>{`
          :root, .dark {
            --bg-primary: #0c0c0d;
            --bg-secondary: #161618;
            --bg-elevated: #1c1c1f;
            --text-primary: #f2f2f3;
            --text-secondary: #b4b4bc;
            --text-muted: #8a8a92;
            --border: #2a2a2e;
            --accent: #7c6cf0;
            --accent-hover: #6354d6;
          }
          body { margin: 0; font-family: system-ui, -apple-system, sans-serif; }
        `}</style>
        <AppErrorFallback
          error={error}
          fullScreen
          onRetry={() => {
            reset();
            window.location.reload();
          }}
        />
      </body>
    </html>
  );
}
