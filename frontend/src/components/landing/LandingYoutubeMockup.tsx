"use client";

import { LandingWindow } from "@/components/landing/LandingWindow";

export function YoutubeLectureMockup() {
  return (
    <LandingWindow title="GS-2 · Laxmikanth lecture 12">
      <div className="p-3 space-y-2">
        <div className="aspect-video rounded-[10px] bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-[var(--accent-light)] text-[var(--accent)] flex items-center justify-center text-sm">
            ▶
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)]">
          <span className="tabular-nums text-[var(--text-secondary)]">12:34</span>
          <span className="px-1.5 py-0.5 rounded-md border border-[var(--accent)] text-[var(--accent)] bg-[var(--accent-light)]">
            Stamp
          </span>
          <span>1.5x</span>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-2 text-[10px] space-y-1">
          <p className="text-[var(--accent)] tabular-nums">12:34</p>
          <p className="text-[var(--text-secondary)]">Basic structure — cannot amend identity</p>
        </div>
      </div>
    </LandingWindow>
  );
}
