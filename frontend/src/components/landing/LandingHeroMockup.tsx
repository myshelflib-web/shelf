import { LandingWindow } from "./LandingWindow";
import {
  BookOpen,
  CalendarDays,
  FileUp,
  Highlighter,
  MessageSquareText,
  Pin,
  Sparkles,
} from "lucide-react";

export function LandingHeroMockup() {
  return (
    <div className="landing-hero-stage landing-float" aria-hidden>
      <div className="grid lg:grid-cols-[220px_1fr_240px] gap-3 min-h-[320px]">
        <LandingWindow title="Shelf — Library" className="hidden lg:flex flex-col">
          <div className="p-3 space-y-2 text-xs">
            <p className="text-[var(--text-muted)] uppercase tracking-wide text-[10px]">
              Sections
            </p>
            <div className="landing-mock-row landing-mock-row-active">
              <BookOpen className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>Polity notes</span>
            </div>
            <div className="landing-mock-row">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Current affairs</span>
            </div>
            <div className="landing-mock-row">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Essay drafts</span>
            </div>
            <div className="mt-4 p-2.5 rounded-lg border border-dashed border-[var(--border)] text-[var(--text-muted)] flex items-center gap-2">
              <FileUp className="w-3.5 h-3.5" />
              Upload PDF
            </div>
          </div>
        </LandingWindow>

        <LandingWindow title="fundamental-rights.pdf" className="flex flex-col">
          <div className="p-4 sm:p-5 text-[13px] leading-relaxed text-[var(--text-secondary)] font-[family-name:var(--font-serif)] space-y-3">
            <p className="font-semibold text-[var(--text-primary)] text-sm">
              Article 14 — Equality before law
            </p>
            <p>
              The State shall not deny to any person equality before the law or the
              equal protection of the laws within the territory of India.
            </p>
            <p>
              <mark className="landing-highlight">
                Reasonable classification is permitted when it is founded on an
                intelligible differentia
              </mark>{" "}
              and bears a rational relation to the object sought to be achieved.
            </p>
            <p className="text-[var(--text-muted)] text-xs">
              Highlight a passage, then ask Study AI to explain or summarize.
            </p>
          </div>
          <div className="mt-auto border-t border-[var(--border)] px-3 py-2 flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
            <Highlighter className="w-3.5 h-3.5 text-[var(--accent)]" />
            3 highlights · 68% read
          </div>
        </LandingWindow>

        <LandingWindow
          title="Study AI"
          className="hidden sm:flex flex-col landing-hero-panel"
        >
          <div className="p-3 space-y-3 text-xs flex-1">
            <div className="rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] p-2.5">
              <p className="text-[var(--text-muted)] mb-1">Selection</p>
              <p className="text-[var(--text-secondary)] line-clamp-2">
                Reasonable classification is permitted when…
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {["Summarize", "Short notes", "Mind map"].map((label) => (
                <span
                  key={label}
                  className="px-2 py-1 rounded-full border border-[var(--border)] text-[10px]"
                >
                  {label}
                </span>
              ))}
            </div>
            <div className="rounded-lg bg-[var(--accent-subtle)] border border-[var(--border)] p-2.5 text-[var(--text-secondary)] leading-relaxed">
              <span className="inline-flex items-center gap-1 text-[var(--accent)] mb-1">
                <Sparkles className="w-3 h-3" />
                Study AI
              </span>
              <p>
                Article 14 allows reasonable classification — groups may be treated
                differently if the basis is rational and tied to the law&apos;s purpose.
              </p>
            </div>
          </div>
          <div className="border-t border-[var(--border)] p-2.5">
            <div className="input-pill text-[11px] text-[var(--text-muted)] py-2">
              Ask about this page…
            </div>
          </div>
        </LandingWindow>
      </div>

      <div className="landing-hero-chip landing-hero-chip-calendar">
        <CalendarDays className="w-3.5 h-3.5 text-[var(--accent)]" />
        <span>Revision · Friday 4pm</span>
      </div>
      <div className="landing-hero-chip landing-hero-chip-pin">
        <Pin className="w-3.5 h-3.5 text-[var(--accent)]" />
        <span>Pinned page</span>
      </div>
      <div className="landing-hero-chip landing-hero-chip-chat">
        <MessageSquareText className="w-3.5 h-3.5 text-[var(--accent)]" />
        <span>Ask on selection</span>
      </div>
    </div>
  );
}
