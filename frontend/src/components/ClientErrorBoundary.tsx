"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { captureComponentError } from "@/lib/analytics/errors";

type Props = {
  children: ReactNode;
};

type State = {
  error: Error | null;
};

function ErrorFallback({
  error,
  onReload,
}: {
  error: Error;
  onReload: () => void;
}) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <p className="text-lg font-medium text-[var(--text-primary)]">
        Something went wrong
      </p>
      <p className="max-w-md text-sm text-[var(--text-muted)]">
        {error.message || "This part of Shelf failed to load."}
      </p>
      <button
        type="button"
        onClick={onReload}
        className="rounded-[10px] bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white"
      >
        Reload page
      </button>
    </div>
  );
}

export class ClientErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    captureComponentError(error, info.componentStack ?? undefined);
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <ErrorFallback
          error={this.state.error}
          onReload={() => window.location.reload()}
        />
      );
    }
    return this.props.children;
  }
}
