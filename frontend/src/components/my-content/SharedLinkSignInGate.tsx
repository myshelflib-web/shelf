"use client";

import { Header } from "@/components/Header";
import { LoginForm } from "@/components/LoginForm";
import { ExplorerSidebarSkeleton } from "@/components/dashboard/DashboardSkeletons";

/** Guest gate on a share link: blurred library chrome + sign-in on top. */
export function SharedLinkSignInGate({ returnTo }: { returnTo: string }) {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <Header />
      <div className="relative flex-1 min-h-0">
        <div
          className="absolute inset-0 flex pointer-events-none select-none blur-[8px] brightness-[0.55] saturate-75"
          aria-hidden
        >
          <aside className="hidden md:flex w-[min(260px,28vw)] shrink-0 flex-col border-r border-[var(--border)] bg-[var(--bg-elevated)]">
            <div className="px-3 py-3 border-b border-[var(--border-subtle)]">
              <p className="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                Library
              </p>
            </div>
            <ExplorerSidebarSkeleton />
          </aside>
          <div className="flex-1 min-w-0 flex flex-col bg-[var(--bg-primary)]">
            <div className="h-12 shrink-0 border-b border-[var(--border)] px-4 flex items-center gap-2">
              <span className="h-3 w-32 rounded bg-[var(--bg-secondary)]" />
              <span className="h-3 w-16 rounded bg-[var(--bg-secondary)]" />
            </div>
            <div className="flex-1 min-h-0 p-6 space-y-3">
              {Array.from({ length: 8 }, (_, i) => (
                <div
                  key={i}
                  className="h-10 rounded-[10px] bg-[var(--bg-secondary)]"
                  style={{ width: `${70 + ((i * 7) % 25)}%` }}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="absolute inset-0 bg-[var(--bg-primary)]/40" aria-hidden />
        <div className="relative z-10 h-full overflow-y-auto flex items-center justify-center px-4 py-8">
          <LoginForm
            embedded
            nextPath={returnTo}
            title="Sign in to open this file"
            subtitle="Anyone with the link can view it after they sign in to Shelf."
          />
        </div>
      </div>
    </div>
  );
}
