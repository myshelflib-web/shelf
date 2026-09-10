import {
  ArrowUp,
  BookOpen,
  CalendarDays,
  Columns2,
  FilePlus,
  FileText,
  FolderPlus,
  NotebookPen,
  PanelLeft,
  PanelRight,
  Plus,
  Search,
  Sparkles,
  Star,
} from "lucide-react";
import { ShelfLogo } from "@/components/ShelfLogo";
import {
  LandingAppPreviewChrome,
  LandingPreviewExplorer,
} from "./LandingPreviewChrome";

export { LandingAppPreviewChrome } from "./LandingPreviewChrome";

export function SlideLibraryHome() {
  return (
    <div className="landing-app-preview h-full flex flex-col">
      <LandingAppPreviewChrome activeNav="library" />
      <div className="flex flex-1 min-h-0">
        <LandingPreviewExplorer />
        <div className="relative flex-1 flex flex-col items-center justify-center px-3 py-3 bg-[var(--bg-primary)] min-w-0 overflow-hidden">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-24 opacity-70"
            style={{
              background:
                "radial-gradient(ellipse 60% 80% at 50% 0%, color-mix(in srgb, var(--accent) 18%, transparent), transparent 70%)",
            }}
            aria-hidden
          />
          <div className="relative w-full max-w-[240px] flex flex-col items-center">
            <ShelfLogo size={28} />
            <p className="mt-2.5 text-[12px] font-semibold text-[var(--text-primary)] tracking-tight">
              Good evening, Alex
            </p>
            <p className="mt-1 text-[7.5px] text-[var(--text-muted)] text-center">
              Search your library or pick up where you left off.
            </p>
            <div className="mt-2.5 w-full flex items-center gap-2 px-2 py-1.5 rounded-[8px] border border-[var(--accent)]/30 bg-[var(--accent-subtle)] text-left">
              <BookOpen className="w-3 h-3 text-[var(--accent)] shrink-0" />
              <span className="min-w-0">
                <span className="block text-[8px] font-medium text-[var(--text-primary)]">
                  Continue reading
                </span>
                <span className="block text-[7px] text-[var(--text-muted)] truncate">
                  course-reader.pdf · Methods
                </span>
              </span>
            </div>
            <div className="flex flex-wrap justify-center gap-1 mt-2 w-full">
              {["Summarize notes", "Quiz me", "Find PDF"].map((chip) => (
                <span
                  key={chip}
                  className="px-1.5 py-0.5 rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] text-[7px] text-[var(--text-secondary)]"
                >
                  {chip}
                </span>
              ))}
            </div>
            <div className="relative w-full mt-2">
              <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <div className="w-full pl-7 pr-2 py-1.5 rounded-[8px] bg-[var(--bg-elevated)] border border-[var(--border)] text-[7.5px] text-[var(--text-muted)]">
                Search across all folders…
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1.5 w-full mt-2">
              <div className="flex items-start gap-1.5 px-2 py-1.5 rounded-[8px] border border-[var(--border)] bg-[var(--bg-secondary)] text-left">
                <FolderPlus className="w-3 h-3 text-[var(--accent)] shrink-0 mt-px" />
                <span>
                  <span className="block text-[7.5px] font-medium text-[var(--text-primary)]">
                    New folder
                  </span>
                  <span className="block text-[6.5px] text-[var(--text-muted)]">
                    Group files
                  </span>
                </span>
              </div>
              <div className="flex items-start gap-1.5 px-2 py-1.5 rounded-[8px] border border-[var(--border)] bg-[var(--bg-secondary)] text-left">
                <FilePlus className="w-3 h-3 text-[var(--accent)] shrink-0 mt-px" />
                <span>
                  <span className="block text-[7.5px] font-medium text-[var(--text-primary)]">
                    Add file
                  </span>
                  <span className="block text-[6.5px] text-[var(--text-muted)]">
                    PDF, notes, link
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SlidePdfReader() {
  return (
    <div className="landing-app-preview h-full flex flex-col">
      <LandingAppPreviewChrome activeNav="library" />
      <div className="flex flex-1 min-h-0">
        <LandingPreviewExplorer activePage="course-reader.pdf" />
        <div className="flex-1 flex flex-col min-w-0 bg-[var(--bg-primary)]">
          <div className="shrink-0 border-b border-[var(--border)] bg-[var(--bg-secondary)] px-1.5 min-h-[26px] flex items-center gap-1">
            <span className="p-1 rounded-md text-[var(--text-muted)]" aria-hidden>
              <PanelLeft className="w-2.5 h-2.5" />
            </span>
            <span className="flex items-center gap-1 max-w-[120px] min-w-0 rounded-md px-1.5 py-1 text-[7.5px] bg-[var(--bg-elevated)] text-[var(--text-primary)] truncate">
              <FileText className="w-2.5 h-2.5 text-[var(--text-muted)] shrink-0" />
              course-reader.pdf
              <span className="text-[var(--text-muted)] opacity-60">×</span>
            </span>
            <span className="flex items-center gap-1 max-w-[90px] min-w-0 rounded-md px-1.5 py-1 text-[7.5px] text-[var(--text-muted)] truncate">
              <NotebookPen className="w-2.5 h-2.5 shrink-0" />
              Chapter notes
            </span>
            <span className="ml-auto flex items-center gap-0.5 text-[var(--text-muted)]">
              <Columns2 className="w-2.5 h-2.5" />
              <PanelRight className="w-2.5 h-2.5 text-[var(--accent)]" />
            </span>
          </div>
          <div className="flex flex-1 min-h-0">
            <div className="relative flex-1 flex flex-col min-w-0 bg-[var(--bg-secondary)]">
              <div className="flex-1 overflow-hidden p-2.5 pb-9">
                <div className="h-full rounded-[4px] border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2.5 text-[8.5px] leading-relaxed text-[var(--text-secondary)] font-[family-name:var(--font-serif)] shadow-sm">
                  <p className="font-semibold text-[var(--text-primary)] text-[9.5px] mb-1">
                    Section 2 — Core concepts
                  </p>
                  <p className="mb-1">
                    The framework distinguishes descriptive and normative claims.{" "}
                    <mark className="landing-highlight">
                      A normative claim states what ought to be, not merely what is.
                    </mark>
                  </p>
                  <p className="text-[7.5px] text-[var(--text-muted)]">
                    Separate evidence from interpretation before you ask Study AI.
                  </p>
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-2 flex justify-center px-3 pointer-events-none">
                <div className="inline-flex items-center gap-0.5 rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] px-1 py-0.5 shadow-[0_6px_20px_rgba(0,0,0,0.18)]">
                  <span className="px-2 py-1 rounded-full text-[7px] text-[var(--text-muted)]">
                    Page 4
                  </span>
                  <span className="flex items-center gap-0.5 px-2 py-1 rounded-full text-[7px] text-[var(--accent)] bg-[var(--accent-light)]">
                    <Sparkles className="w-2.5 h-2.5" />
                    Study AI
                  </span>
                  <span className="px-1.5 py-1 rounded-full text-[var(--text-muted)]">
                    <Star className="w-2.5 h-2.5" />
                  </span>
                  <span className="flex items-center gap-0.5 px-2 py-1 rounded-full text-[7px] text-[var(--text-muted)]">
                    <CalendarDays className="w-2.5 h-2.5" />
                    Schedule
                  </span>
                </div>
              </div>
            </div>
            <aside className="w-[128px] shrink-0 border-l border-[var(--border)] bg-[var(--bg-elevated)] hidden sm:flex flex-col min-h-0">
              <div className="px-2 pt-2 pb-1.5 border-b border-[var(--border-subtle)] flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-md bg-[var(--accent-light)] flex items-center justify-center">
                  <Sparkles className="w-2.5 h-2.5 text-[var(--accent)]" />
                </span>
                <div className="min-w-0">
                  <p className="text-[8px] font-semibold text-[var(--text-primary)] leading-none">
                    Study AI
                  </p>
                  <p className="text-[6.5px] text-[var(--text-muted)] mt-0.5 truncate">
                    This page
                  </p>
                </div>
              </div>
              <div className="flex-1 p-1.5 space-y-1.5 overflow-hidden">
                <div className="rounded-lg bg-[var(--accent-subtle)] border border-[var(--accent)]/20 px-1.5 py-1 text-[6.5px] text-[var(--text-muted)]">
                  Selection
                  <p className="mt-0.5 text-[var(--text-secondary)] line-clamp-2">
                    A normative claim states what ought to be…
                  </p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {["Summarize", "Notes", "Ask"].map((label) => (
                    <span
                      key={label}
                      className="px-1.5 py-0.5 rounded-full border border-[var(--border)] text-[6.5px] text-[var(--text-muted)]"
                    >
                      {label}
                    </span>
                  ))}
                </div>
                <div className="rounded-xl rounded-bl-md border border-[var(--border)] bg-[var(--bg-secondary)] px-1.5 py-1.5 text-[7px] leading-snug text-[var(--text-secondary)]">
                  Normative claims prescribe; keep them distinct from evidence.
                </div>
              </div>
              <div className="p-1.5 pt-0">
                <div className="flex items-center h-7 rounded-full border border-[var(--border)] bg-[var(--bg-primary)] px-1.5 shadow-sm">
                  <span className="text-[6.5px] text-[var(--text-muted)] flex-1 truncate pl-1">
                    Ask about this page…
                  </span>
                  <span className="w-5 h-5 rounded-full bg-[var(--accent)] flex items-center justify-center shrink-0">
                    <ArrowUp className="w-2.5 h-2.5 text-white" />
                  </span>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SlideStudyAi() {
  return (
    <div className="landing-app-preview h-full flex flex-col">
      <LandingAppPreviewChrome activeNav="study-ai" />
      <div className="flex flex-1 min-h-0">
        <aside className="w-[120px] shrink-0 border-r border-[var(--border)] bg-[var(--bg-sidebar)] hidden sm:flex flex-col min-h-0">
          <div className="p-1.5 space-y-1.5">
            <div className="h-7 rounded-[7px] border border-[var(--border)] bg-[var(--bg-elevated)] flex items-center justify-center gap-1 text-[7.5px] font-semibold text-[var(--text-primary)]">
              <Plus className="w-2.5 h-2.5" />
              New chat
            </div>
            <div className="h-6 rounded-[7px] border border-[var(--border)] bg-[var(--bg-elevated)] flex items-center gap-1 px-1.5 text-[7px] text-[var(--text-muted)]">
              <Search className="w-2.5 h-2.5 shrink-0" />
              Search
            </div>
          </div>
          <div className="px-1.5 flex-1 overflow-hidden space-y-0.5">
            <p className="text-[6.5px] font-bold uppercase tracking-wider text-[var(--text-muted)] px-1 pt-0.5 pb-1">
              Today
            </p>
            <div className="px-1.5 py-1.5 rounded-[7px] bg-[var(--bg-elevated)] text-[7.5px] font-semibold text-[var(--text-primary)] truncate">
              Chapter revision
            </div>
            <div className="px-1.5 py-1.5 rounded-[7px] text-[7.5px] text-[var(--text-secondary)] truncate">
              Syllabus Q&amp;A
            </div>
            <div className="px-1.5 py-1.5 rounded-[7px] text-[7.5px] text-[var(--text-secondary)] truncate">
              Flashcards draft
            </div>
          </div>
        </aside>
        <div className="relative flex-1 flex flex-col min-w-0 bg-[var(--bg-primary)]">
          <div className="h-8 shrink-0 border-b border-[var(--border)] px-2.5 flex items-center justify-between gap-2">
            <span className="text-[9px] font-bold text-[var(--text-primary)] truncate">
              Chapter revision
            </span>
            <span className="text-[6.5px] text-[var(--text-muted)] shrink-0">
              Scope · Methods
            </span>
          </div>
          <div className="flex-1 overflow-hidden px-2.5 pt-2.5 pb-12 space-y-2.5">
            <div className="ml-auto max-w-[70%] rounded-2xl rounded-br-md bg-[var(--accent)] px-2.5 py-1.5 text-[7.5px] text-white leading-snug">
              Compare my notes with the PDF. What am I missing?
            </div>
            <div className="flex gap-1.5 max-w-[92%]">
              <span className="w-[18px] h-[18px] rounded-md bg-[var(--accent-subtle)] flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-2.5 h-2.5 text-[var(--accent)]" />
              </span>
              <div className="rounded-2xl rounded-bl-md border border-[var(--border)] bg-[var(--bg-elevated)] px-2.5 py-1.5 text-[7.5px] text-[var(--text-secondary)] leading-snug min-w-0">
                <p className="text-[6.5px] font-semibold uppercase tracking-wide text-[var(--accent)] mb-0.5">
                  Study AI
                </p>
                <p>
                  Your notes cover the broad ideas; the PDF adds methodology and
                  citation details worth folding in before revision.
                </p>
                <p className="text-[6.5px] text-[var(--accent)] mt-1 font-medium">
                  course-reader.pdf · Chapter notes
                </p>
              </div>
            </div>
          </div>
          <div className="absolute inset-x-0 bottom-2 flex justify-center px-3 pointer-events-none">
            <div className="w-full max-w-[280px] flex items-center gap-1 h-8 rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] pl-1 pr-1 shadow-[0_6px_20px_rgba(0,0,0,0.16)]">
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-[var(--text-muted)] shrink-0">
                <Plus className="w-3 h-3" />
              </span>
              <span className="flex-1 text-[8px] text-[var(--text-muted)] truncate">
                Ask anything
              </span>
              <span className="w-6 h-6 rounded-full bg-[var(--accent)] flex items-center justify-center shrink-0">
                <ArrowUp className="w-3 h-3 text-white" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SlideGoalPicker() {
  return (
    <div className="landing-app-preview h-full flex flex-col">
      <LandingAppPreviewChrome activeNav="library" />
      <div className="flex flex-1 min-h-0 items-center justify-center p-4 bg-[var(--bg-primary)]">
        <div className="w-full max-w-[248px] rounded-[10px] border border-[var(--border)] bg-[var(--bg-elevated)] p-3 shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
          <p className="text-[10px] font-semibold text-[var(--text-primary)]">
            What are you working toward?
          </p>
          <p className="text-[7.5px] text-[var(--text-muted)] mt-0.5">
            Optional — you can change this anytime in Settings.
          </p>
          <div className="grid grid-cols-2 gap-1.5 mt-2.5">
            {[
              "Learn a subject",
              "Research project",
              "Build expertise",
              "Assessment prep",
            ].map((label, i) => (
              <div
                key={label}
                className={`px-2 py-2 rounded-[8px] border text-[7.5px] text-left ${
                  i === 2
                    ? "border-[var(--accent)] bg-[var(--accent-subtle)] text-[var(--accent)] font-medium"
                    : "border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-secondary)]"
                }`}
              >
                {label}
              </div>
            ))}
          </div>
          <div className="mt-2.5 rounded-[8px] border border-[var(--accent)]/25 bg-[var(--accent-subtle)] px-2 py-1.5 text-[7px] text-[var(--text-secondary)] leading-snug">
            <span className="font-medium text-[var(--accent)]">Goal active</span>
            <p className="mt-0.5">Study AI and planner stay aligned to your focus.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
