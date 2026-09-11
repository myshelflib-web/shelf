"use client";

import { useEffect } from "react";
import { AppErrorFallback } from "@/components/AppErrorFallback";
import { captureComponentError } from "@/lib/analytics/errors";

export default function Error({
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
    <AppErrorFallback
      error={error}
      fullScreen
      onRetry={() => {
        reset();
        window.location.reload();
      }}
    />
  );
}
