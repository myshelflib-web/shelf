"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { AppErrorFallback } from "@/components/AppErrorFallback";
import { captureComponentError } from "@/lib/analytics/errors";

type Props = {
  children: ReactNode;
};

type State = {
  error: Error | null;
};

const CHUNK_RELOAD_KEY = "shelf:chunk-reload-at";

function maybeAutoReloadChunkError(error: Error): boolean {
  if (typeof window === "undefined") return false;
  const name = error.name || "";
  const msg = error.message || "";
  const isChunk =
    name === "ChunkLoadError" || /Loading chunk .+ failed/i.test(msg);
  if (!isChunk) return false;
  try {
    const last = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) || "0");
    if (Number.isFinite(last) && Date.now() - last < 15_000) {
      return false;
    }
    sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()));
    window.location.reload();
    return true;
  } catch {
    return false;
  }
}

export class ClientErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    captureComponentError(error, info.componentStack ?? undefined);
    maybeAutoReloadChunkError(error);
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <AppErrorFallback
          error={this.state.error}
          fullScreen
          onRetry={() => {
            this.setState({ error: null });
            window.location.reload();
          }}
        />
      );
    }
    return this.props.children;
  }
}
