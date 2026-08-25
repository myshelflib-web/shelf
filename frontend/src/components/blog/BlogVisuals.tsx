"use client";

import type { ReactNode } from "react";
import {
  BookOpen,
  CalendarDays,
  FileUp,
  Highlighter,
  LayoutDashboard,
  Pin,
  Sparkles,
} from "lucide-react";
import { LandingWindow } from "@/components/landing/LandingWindow";

export type BlogVisualId =
  | "upload"
  | "study-ai"
  | "calendar"
  | "dashboard"
  | "library"
  | "reader"
  | "planner-board"
  | "premium"
  | "curriculum"
  | "notebook"
  | "split-view"
  | "sync"
  | "keyboard"
  | "spotify"
  | "pwa";

export function UploadVisual() {
  return (
    <LandingWindow title="Shelf — Upload">
      <div className="p-4 space-y-3">
        <div className="file-upload-zone py-8 text-center">
          <FileUp className="file-upload-icon w-8 h-8 text-[var(--accent)] mx-auto mb-2" />
          <p className="text-sm font-medium">Drop your PDF here</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Parsed text or original PDF view
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 rounded-lg border border-[var(--accent)] bg-[var(--accent-subtle)]">
            <p className="font-medium">Parsed</p>
            <p className="text-[var(--text-muted)]">Highlight & Study AI</p>
          </div>
          <div className="p-2.5 rounded-lg border border-[var(--border)]">
            <p className="font-medium">Original</p>
            <p className="text-[var(--text-muted)]">View as PDF</p>
          </div>
        </div>
      </div>
    </LandingWindow>
  );
}

export function StudyAIVisual() {
  return (
    <div className="relative">
      <LandingWindow title="constitutional-amendments.pdf">
        <div className="p-4 text-xs text-[var(--text-secondary)] font-[family-name:var(--font-serif)] space-y-2">
          <p>
            <mark className="landing-highlight">Basic Structure doctrine</mark> limits
            Parliament&apos;s power to amend the Constitution beyond its core identity.
          </p>
          <p className="text-[var(--text-muted)]">
            Kesavananda Bharati (1973) established that certain features cannot be
            destroyed by amendment.
          </p>
        </div>
      </LandingWindow>
      <div className="landing-floating-panel">
        <LandingWindow title="Study AI">
          <div className="p-3 space-y-2 text-xs">
            <p className="text-[var(--text-muted)]">Explain this highlight</p>
            <div className="rounded-lg bg-[var(--bg-secondary)] p-2.5 leading-relaxed">
              The Basic Structure doctrine means amendments cannot alter the
              Constitution&apos;s essential character.
            </div>
            <div className="flex gap-1.5">
              <span className="px-2 py-1 rounded-full bg-[var(--accent-subtle)] text-[var(--accent)] text-[10px] inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Short notes
              </span>
            </div>
          </div>
        </LandingWindow>
      </div>
    </div>
  );
}

export function CalendarVisual() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return (
    <LandingWindow title="Shelf — Planner">
      <div className="p-4">
        <div className="grid grid-cols-7 gap-1 text-[10px] text-center text-[var(--text-muted)] mb-2">
          {days.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 mb-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className={`aspect-square rounded-md border text-[10px] flex items-center justify-center ${
                i === 2
                  ? "border-[var(--accent)] bg-[var(--accent-subtle)] text-[var(--accent)]"
                  : "border-[var(--border)] text-[var(--text-muted)]"
              }`}
            >
              {12 + i}
            </div>
          ))}
        </div>
        <div className="space-y-1.5 text-xs">
          <div className="flex items-center gap-2 p-2 rounded-lg border border-[var(--border)]">
            <CalendarDays className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Polity revision</span>
          </div>
        </div>
      </div>
    </LandingWindow>
  );
}

export function DashboardVisual() {
  return (
    <LandingWindow title="Shelf — Dashboard">
      <div className="p-4 grid sm:grid-cols-2 gap-3 text-xs">
        <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)]">
          <LayoutDashboard className="w-4 h-4 text-[var(--accent)] mb-2" />
          <p className="font-medium">12 pages read</p>
          <p className="text-[var(--text-muted)]">7-day streak</p>
        </div>
        <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)]">
          <CalendarDays className="w-4 h-4 text-[var(--accent)] mb-2" />
          <p className="font-medium">3 open tasks</p>
        </div>
        <div className="sm:col-span-2 p-3 rounded-lg border border-[var(--border)]">
          <p className="font-medium mb-2 inline-flex items-center gap-1.5">
            <Pin className="w-3.5 h-3.5 text-[var(--accent)]" />
            Continue reading
          </p>
          <div className="landing-mock-row">Fundamental rights</div>
        </div>
      </div>
    </LandingWindow>
  );
}

export function LibraryVisual() {
  return (
    <LandingWindow title="Shelf — Library">
      <div className="p-3 space-y-2 text-xs">
        {["Polity notes", "Current affairs", "Essay drafts"].map((name, i) => (
          <div
            key={name}
            className={`landing-mock-row ${i === 0 ? "landing-mock-row-active" : ""}`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="flex-1">{name}</span>
          </div>
        ))}
      </div>
    </LandingWindow>
  );
}

export function ReaderVisual() {
  return (
    <LandingWindow title="fundamental-rights.pdf">
      <div className="p-4 text-xs space-y-2 font-[family-name:var(--font-serif)]">
        <p className="text-[var(--text-secondary)]">
          <mark className="landing-highlight">Article 14</mark> — equality before law
        </p>
        <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] pt-2 border-t border-[var(--border)]">
          <Highlighter className="w-3.5 h-3.5 text-[var(--accent)]" />
          Highlight · Pen · Schedule
        </div>
      </div>
    </LandingWindow>
  );
}

export function SplitViewVisual() {
  return (
    <div className="grid grid-cols-2 gap-2">
      <LandingWindow title="case-law.pdf">
        <div className="p-3 text-[10px] text-[var(--text-muted)]">Source A</div>
      </LandingWindow>
      <LandingWindow title="notes.pdf">
        <div className="p-3 text-[10px] text-[var(--text-muted)]">Source B</div>
      </LandingWindow>
    </div>
  );
}

export function PremiumVisual() {
  return (
    <LandingWindow title="Shelf Premium">
      <div className="p-4 text-xs space-y-2">
        <div className="p-3 rounded-lg bg-[var(--accent-subtle)] border border-[var(--accent)]">
          <Sparkles className="w-5 h-5 text-[var(--accent)] mb-2" />
          <p className="font-semibold">10 GB · 2M AI tokens</p>
        </div>
        <p className="text-[var(--text-muted)]">Deeper library search & longer chats</p>
      </div>
    </LandingWindow>
  );
}

export function CurriculumVisual() {
  return (
    <LandingWindow title="Shelf Learn">
      <div className="p-3 space-y-1.5 text-xs">
        {["Polity", "Economy", "History"].map((s) => (
          <div key={s} className="landing-mock-row">
            <BookOpen className="w-3.5 h-3.5" />
            {s}
          </div>
        ))}
      </div>
    </LandingWindow>
  );
}

export function NotebookVisual() {
  return (
    <LandingWindow title="Sketch notebook">
      <div className="p-4 h-32 bg-[linear-gradient(var(--border)_1px,transparent_1px)] bg-[length:100%_24px] text-xs text-[var(--text-muted)]">
        Ruled paper · draw &amp; annotate
      </div>
    </LandingWindow>
  );
}

export function SyncVisual() {
  return (
    <LandingWindow title="Reading progress">
      <div className="p-4 text-xs space-y-2">
        <div className="flex justify-between">
          <span>PDF page</span>
          <span className="text-[var(--accent)] font-medium">42 / 128</span>
        </div>
        <div className="h-1.5 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
          <div className="h-full w-[33%] bg-[var(--accent)] rounded-full" />
        </div>
        <p className="text-[var(--text-muted)]">Synced across devices</p>
      </div>
    </LandingWindow>
  );
}

export function KeyboardVisual() {
  return (
    <LandingWindow title="⌘K Search">
      <div className="p-3 text-xs space-y-2">
        <div className="p-2 rounded-lg border border-[var(--accent)] bg-[var(--accent-subtle)]">
          Search library…
        </div>
        <div className="landing-mock-row">fundamental-rights.pdf</div>
        <div className="landing-mock-row">Polity notes</div>
      </div>
    </LandingWindow>
  );
}

export function SpotifyVisual() {
  return (
    <div className="grid grid-cols-[1fr_120px] gap-2">
      <LandingWindow title="economy.pdf">
        <div className="p-3 text-[10px] text-[var(--text-muted)]">Reading</div>
      </LandingWindow>
      <LandingWindow title="Focus audio">
        <div className="p-2 text-[10px] text-center text-[var(--accent)]">♫ Spotify</div>
      </LandingWindow>
    </div>
  );
}

export function PwaVisual() {
  return (
    <LandingWindow title="Install Shelf">
      <div className="p-4 text-xs text-center space-y-2">
        <div className="w-12 h-12 mx-auto rounded-xl bg-[var(--accent-subtle)] flex items-center justify-center">
          <BookOpen className="w-6 h-6 text-[var(--accent)]" />
        </div>
        <p className="font-medium">Add to Home Screen</p>
        <p className="text-[var(--text-muted)]">Study like a native app</p>
      </div>
    </LandingWindow>
  );
}

const VISUALS: Record<BlogVisualId, () => ReactNode> = {
  upload: UploadVisual,
  "study-ai": StudyAIVisual,
  calendar: CalendarVisual,
  dashboard: DashboardVisual,
  library: LibraryVisual,
  reader: ReaderVisual,
  "planner-board": CalendarVisual,
  premium: PremiumVisual,
  curriculum: CurriculumVisual,
  notebook: NotebookVisual,
  "split-view": SplitViewVisual,
  sync: SyncVisual,
  keyboard: KeyboardVisual,
  spotify: SpotifyVisual,
  pwa: PwaVisual,
};

export function BlogVisual({ id }: { id: BlogVisualId }) {
  const Component = VISUALS[id];
  return <div className="blog-visual landing-showcase">{Component()}</div>;
}
