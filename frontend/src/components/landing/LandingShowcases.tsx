import Link from "next/link";
import { RevealOnScroll } from "@/components/RevealOnScroll";
import { LandingWindow } from "./LandingWindow";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  FileUp,
  LayoutDashboard,
  MessageSquareText,
  Pin,
  Sparkles,
} from "lucide-react";

function ShowcaseSection({
  title,
  body,
  linkHref,
  linkLabel,
  visual,
  reverse = false,
}: {
  title: string;
  body: string;
  linkHref: string;
  linkLabel: string;
  visual: React.ReactNode;
  reverse?: boolean;
}) {
  return (
    <section className="px-4 sm:px-6 py-10 sm:py-14">
      <div className="max-w-6xl mx-auto landing-showcase">
        <div
          className={`grid lg:grid-cols-2 gap-8 lg:gap-12 items-center ${
            reverse ? "lg:[&>*:first-child]:order-2" : ""
          }`}
        >
          <RevealOnScroll>
            <h2 className="text-2xl sm:text-3xl font-semibold mb-4 tracking-tight leading-tight">
              {title}
            </h2>
            <p className="text-[var(--text-secondary)] leading-relaxed mb-5 max-w-md">
              {body}
            </p>
            <Link
              href={linkHref}
              className="inline-flex items-center gap-1.5 text-sm text-[var(--accent)] hover:underline"
            >
              {linkLabel}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </RevealOnScroll>
          <RevealOnScroll delay={80}>{visual}</RevealOnScroll>
        </div>
      </div>
    </section>
  );
}

function UploadMockup() {
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
        <div className="space-y-1.5 pt-1">
          {["Polity notes", "Economy PDF", "Essay drafts"].map((name, i) => (
            <div key={name} className="landing-mock-row text-xs">
              <BookOpen className="w-3.5 h-3.5" />
              <span className="flex-1">{name}</span>
              <span className="text-[var(--text-muted)]">{3 - i} pages</span>
            </div>
          ))}
        </div>
      </div>
    </LandingWindow>
  );
}

function StudyAIMockup() {
  return (
    <div className="relative">
      <LandingWindow title="constitutional-amendments.pdf">
        <div className="p-4 text-xs text-[var(--text-secondary)] font-[family-name:var(--font-serif)] space-y-2">
          <p>
            <mark className="landing-highlight">Basic Structure doctrine</mark>{" "}
            limits Parliament&apos;s power to amend the Constitution beyond its core
            identity.
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
              Constitution&apos;s essential character — judicial review, federalism,
              and fundamental rights remain protected.
            </div>
            <div className="flex gap-1.5">
              <span className="px-2 py-1 rounded-full bg-[var(--accent-subtle)] text-[var(--accent)] text-[10px] inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Short notes
              </span>
              <span className="px-2 py-1 rounded-full border border-[var(--border)] text-[10px]">
                Mind map
              </span>
            </div>
          </div>
        </LandingWindow>
      </div>
    </div>
  );
}

function CalendarMockup() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return (
    <LandingWindow title="Shelf — Calendar">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3 text-xs">
          <span className="font-medium">August 2026</span>
          <span className="text-[var(--text-muted)]">Week view</span>
        </div>
        <div className="grid grid-cols-7 gap-1 text-[10px] text-center text-[var(--text-muted)] mb-2">
          {days.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 14 }).map((_, i) => (
            <div
              key={i}
              className={`aspect-square rounded-md border text-[10px] flex items-center justify-center ${
                i === 4
                  ? "border-[var(--accent)] bg-[var(--accent-subtle)] text-[var(--accent)]"
                  : "border-[var(--border)] text-[var(--text-muted)]"
              }`}
            >
              {12 + i}
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-1.5 text-xs">
          <div className="flex items-center gap-2 p-2 rounded-lg border border-[var(--border)]">
            <CalendarDays className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Polity revision</span>
            <span className="ml-auto text-[var(--text-muted)]">Fri 4pm</span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg border border-[var(--border)]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <span>Finish economy PDF</span>
          </div>
        </div>
      </div>
    </LandingWindow>
  );
}

function DashboardMockup() {
  return (
    <LandingWindow title="Shelf — Dashboard">
      <div className="p-4 grid sm:grid-cols-2 gap-3 text-xs">
        <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)]">
          <LayoutDashboard className="w-4 h-4 text-[var(--accent)] mb-2" />
          <p className="font-medium">12 pages</p>
          <p className="text-[var(--text-muted)]">4 sections</p>
        </div>
        <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)]">
          <CalendarDays className="w-4 h-4 text-[var(--accent)] mb-2" />
          <p className="font-medium">3 open tasks</p>
          <p className="text-[var(--text-muted)]">2 events this week</p>
        </div>
        <div className="sm:col-span-2 p-3 rounded-lg border border-[var(--border)]">
          <p className="font-medium mb-2 inline-flex items-center gap-1.5">
            <Pin className="w-3.5 h-3.5 text-[var(--accent)]" />
            Pinned
          </p>
          <div className="space-y-1">
            <div className="landing-mock-row">Fundamental rights</div>
            <div className="landing-mock-row">Directive principles</div>
          </div>
        </div>
        <div className="sm:col-span-2 p-3 rounded-lg border border-[var(--border)] bg-[var(--accent-subtle)]">
          <p className="font-medium mb-1 inline-flex items-center gap-1.5">
            <MessageSquareText className="w-3.5 h-3.5 text-[var(--accent)]" />
            Study AI
          </p>
          <p className="text-[var(--text-secondary)]">
            Jump back into any page and continue asking from your material.
          </p>
        </div>
      </div>
    </LandingWindow>
  );
}

export function LandingShowcases() {
  return (
    <>
      <ShowcaseSection
        title="Upload your notes into private sections"
        body="Bring PDFs and pages into folders you control. Choose parsed text for highlights and Study AI, or keep the original PDF when you need it."
        linkHref="/login"
        linkLabel="Start uploading"
        visual={<UploadMockup />}
      />
      <ShowcaseSection
        title="Highlight a passage, ask Study AI"
        body="Select any text while reading. Summarize, get short notes, build a mind map, or ask a follow-up — all grounded in what you uploaded."
        linkHref="/about"
        linkLabel="How Study AI works"
        visual={<StudyAIMockup />}
        reverse
      />
      <ShowcaseSection
        title="Plan revision on your calendar"
        body="Add tasks and events that link back to your pages. See the week at a glance and open the exact note when it is time to study."
        linkHref="/login"
        linkLabel="Open your calendar"
        visual={<CalendarMockup />}
      />
      <ShowcaseSection
        title="One dashboard for everything"
        body="After sign-in, your profile brings together library, calendar, pinned pages, and Study AI — no switching between tools."
        linkHref="/login"
        linkLabel="See your dashboard"
        visual={<DashboardMockup />}
        reverse
      />
    </>
  );
}
