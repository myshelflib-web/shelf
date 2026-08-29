"use client";

import { LandingDualWindows } from "./LandingDualWindows";
import { LandingShowcaseMorph } from "./LandingShowcaseMorph";
import {
  CalendarDays,
  CheckCircle2,
  LayoutDashboard,
  MessageSquareText,
  Pin,
  Sparkles,
} from "lucide-react";

function PdfHighlightBack() {
  return (
    <div className="p-4 text-xs text-[var(--text-secondary)] font-[family-name:var(--font-serif)] space-y-2">
      <p>
        <mark className="landing-highlight">Basic Structure doctrine</mark> limits
        Parliament&apos;s power to amend the Constitution beyond its core
        identity.
      </p>
      <p className="text-[var(--text-muted)]">
        Kesavananda Bharati (1973) established that certain features cannot be
        destroyed by amendment.
      </p>
    </div>
  );
}

function StudyAiAnswerFront() {
  return (
    <div className="p-3 space-y-2 text-xs">
      <p className="text-[var(--text-muted)]">Explain this highlight</p>
      <div className="rounded-lg bg-[var(--bg-secondary)] p-2.5 leading-relaxed text-[var(--text-secondary)]">
        The Basic Structure doctrine means amendments cannot alter the
        Constitution&apos;s essential character — judicial review, federalism,
        and fundamental rights remain protected.
      </div>
      <div className="flex gap-1.5 flex-wrap">
        <span className="px-2 py-1 rounded-full bg-[var(--accent-subtle)] text-[var(--accent)] text-[10px] inline-flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          Short notes
        </span>
        <span className="px-2 py-1 rounded-full border border-[var(--border)] text-[10px]">
          Mind map
        </span>
      </div>
    </div>
  );
}

function StudyAiMindmapFront() {
  return (
    <div className="p-3 text-xs space-y-2">
      <p className="text-[var(--text-muted)]">Mind map from highlight</p>
      <div className="rounded-lg border border-[var(--border)] p-2.5 space-y-1.5">
        <p className="font-medium text-[var(--accent)]">Basic Structure</p>
        <p className="pl-3 text-[var(--text-muted)]">↳ Judicial review</p>
        <p className="pl-3 text-[var(--text-muted)]">↳ Federalism</p>
        <p className="pl-3 text-[var(--text-muted)]">↳ Fundamental rights</p>
      </div>
    </div>
  );
}

export function StudyAIMockup() {
  return (
    <LandingShowcaseMorph
      frames={[
        <LandingDualWindows
          key="ai-a"
          backTitle="constitutional-amendments.pdf"
          back={<PdfHighlightBack />}
          frontTitle="Study AI"
          front={<StudyAiAnswerFront />}
          frontWide
        />,
        <LandingDualWindows
          key="ai-b"
          backTitle="constitutional-amendments.pdf"
          back={<PdfHighlightBack />}
          frontTitle="Study AI"
          front={<StudyAiMindmapFront />}
          frontWide
        />,
      ]}
    />
  );
}

function CalendarBack() {
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  return (
    <div className="p-3">
      <div className="flex justify-between text-[10px] mb-2">
        <span className="font-medium">August 2026</span>
        <span className="text-[var(--text-muted)]">Week</span>
      </div>
      <div className="grid grid-cols-7 gap-1 text-[9px] text-center text-[var(--text-muted)] mb-1">
        {days.map((d, i) => (
          <span key={`${d}-${i}`}>{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 14 }).map((_, i) => (
          <div
            key={i}
            className={`aspect-square rounded text-[9px] flex items-center justify-center border ${
              i === 4
                ? "border-[var(--accent)] bg-[var(--accent-subtle)] text-[var(--accent)]"
                : "border-[var(--border)] text-[var(--text-muted)]"
            }`}
          >
            {12 + i}
          </div>
        ))}
      </div>
    </div>
  );
}

function TasksFront() {
  return (
    <div className="p-3 space-y-1.5 text-xs">
      <p className="text-[10px] text-[var(--text-muted)]">Friday</p>
      <div className="flex items-center gap-2 p-2 rounded-lg border border-[var(--border)]">
        <CalendarDays className="w-3.5 h-3.5 text-[var(--accent)]" />
        <span>Polity revision</span>
        <span className="ml-auto text-[var(--text-muted)]">4pm</span>
      </div>
      <div className="flex items-center gap-2 p-2 rounded-lg border border-[var(--border)]">
        <CheckCircle2 className="w-3.5 h-3.5 text-[var(--text-muted)]" />
        <span>Finish economy PDF</span>
      </div>
    </div>
  );
}

function MonthBack() {
  return (
    <div className="p-3 text-xs space-y-2">
      <p className="font-medium">This month</p>
      <div className="grid grid-cols-3 gap-2">
        {["12 tasks", "4 events", "8 done"].map((t) => (
          <div
            key={t}
            className="p-2 rounded-lg border border-[var(--border)] text-center text-[10px] text-[var(--text-muted)]"
          >
            {t}
          </div>
        ))}
      </div>
    </div>
  );
}

function EventFront() {
  return (
    <div className="p-3 text-xs">
      <p className="font-medium mb-1">Mock test review</p>
      <p className="text-[var(--text-muted)]">Sat · 10:00 – 11:30</p>
      <p className="mt-2 text-[var(--text-secondary)] leading-relaxed">
        Opens linked page when the event starts.
      </p>
    </div>
  );
}

export function CalendarMockup() {
  return (
    <LandingShowcaseMorph
      frames={[
        <LandingDualWindows
          key="cal-a"
          backTitle="Shelf — Planner"
          back={<CalendarBack />}
          frontTitle="Today"
          front={<TasksFront />}
        />,
        <LandingDualWindows
          key="cal-b"
          backTitle="Shelf — Planner"
          back={<MonthBack />}
          frontTitle="Upcoming event"
          front={<EventFront />}
        />,
      ]}
    />
  );
}

function StatsBack() {
  return (
    <div className="p-3 grid grid-cols-2 gap-2 text-xs">
      <div className="p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)]">
        <LayoutDashboard className="w-4 h-4 text-[var(--accent)] mb-1" />
        <p className="font-medium">12 pages</p>
        <p className="text-[10px] text-[var(--text-muted)]">4 collections</p>
      </div>
      <div className="p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)]">
        <CalendarDays className="w-4 h-4 text-[var(--accent)] mb-1" />
        <p className="font-medium">3 tasks</p>
        <p className="text-[10px] text-[var(--text-muted)]">2 this week</p>
      </div>
    </div>
  );
}

function ReadingFront() {
  return (
    <div className="p-3 text-xs text-center">
      <div className="w-16 h-16 mx-auto rounded-full border-4 border-[var(--accent)] border-t-transparent rotate-45 mb-2" />
      <p className="font-medium">32 / 45 min</p>
      <p className="text-[var(--text-muted)]">Today&apos;s reading goal</p>
    </div>
  );
}

function PinnedBack() {
  return (
    <div className="p-3 space-y-1 text-xs">
      <p className="font-medium inline-flex items-center gap-1 mb-1">
        <Pin className="w-3.5 h-3.5 text-[var(--accent)]" />
        Pinned
      </p>
      <div className="landing-mock-row">Fundamental rights</div>
      <div className="landing-mock-row">Directive principles</div>
    </div>
  );
}

function StudyAiContinueFront() {
  return (
    <div className="p-3 text-xs space-y-2">
      <p className="font-medium inline-flex items-center gap-1.5">
        <MessageSquareText className="w-3.5 h-3.5 text-[var(--accent)]" />
        Continue Study AI
      </p>
      <p className="text-[var(--text-secondary)] leading-relaxed">
        Pick up the thread from constitutional-amendments.pdf.
      </p>
    </div>
  );
}

export function DashboardMockup() {
  return (
    <LandingShowcaseMorph
      frames={[
        <LandingDualWindows
          key="dash-a"
          backTitle="Shelf — Dashboard"
          back={<StatsBack />}
          frontTitle="Reading ring"
          front={<ReadingFront />}
        />,
        <LandingDualWindows
          key="dash-b"
          backTitle="Shelf — Dashboard"
          back={<PinnedBack />}
          frontTitle="Study AI"
          front={<StudyAiContinueFront />}
        />,
      ]}
    />
  );
}
