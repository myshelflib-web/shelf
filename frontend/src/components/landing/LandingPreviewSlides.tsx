import {
  BookOpen,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FilePlus,
  FileText,
  FolderPlus,
  Highlighter,
  LayoutDashboard,
  ListChecks,
  MessageSquareText,
  Moon,
  NotebookPen,
  Search,
  Sparkles,
  Star,
} from "lucide-react";
import { ShelfLogo } from "@/components/ShelfLogo";

type PreviewNav = "library" | "dashboard" | "planner" | "quiz" | "study-ai";

const NAV: { id: PreviewNav; icon: typeof BookOpen; label: string }[] = [
  { id: "library", icon: BookOpen, label: "Library" },
  { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { id: "planner", icon: CalendarDays, label: "Planner" },
  { id: "quiz", icon: ListChecks, label: "Quiz" },
  { id: "study-ai", icon: MessageSquareText, label: "Study AI" },
];

export function LandingAppPreviewChrome({ activeNav }: { activeNav: PreviewNav }) {
  return (
    <div className="h-9 shrink-0 border-b border-[var(--border)] bg-[var(--bg-primary)] flex items-center justify-between gap-2 px-2.5">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="flex items-center gap-1.5 shrink-0">
          <ShelfLogo size={16} />
          <span className="font-semibold text-[11px] tracking-tight text-[var(--text-primary)]">
            Shelf
          </span>
        </div>
        <nav className="hidden sm:flex items-center gap-0.5 min-w-0" aria-hidden>
          {NAV.map(({ id, icon: Icon, label }) => (
            <span
              key={id}
              className={`inline-flex items-center gap-1 px-1.5 py-1 rounded-lg text-[9px] whitespace-nowrap ${
                activeNav === id
                  ? "bg-[var(--bg-elevated)] text-[var(--text-primary)]"
                  : "text-[var(--text-muted)]"
              }`}
            >
              <Icon className="w-2.5 h-2.5 shrink-0" />
              {label}
            </span>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <span className="p-1 rounded-lg text-[var(--text-muted)]" aria-hidden>
          <Search className="w-3 h-3" />
        </span>
        <span className="p-1 rounded-lg text-[var(--text-muted)]" aria-hidden>
          <Moon className="w-3 h-3" />
        </span>
        <span className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-[var(--accent-subtle)] text-[var(--accent)] text-[8px] font-medium">
          <Sparkles className="w-2.5 h-2.5" />
          Upgrade
        </span>
        <span className="w-[22px] h-[22px] rounded-full bg-[var(--accent)] text-white text-[8px] font-medium flex items-center justify-center">
          A
        </span>
      </div>
    </div>
  );
}

function ExplorerSidebar({ activePage }: { activePage?: string }) {
  return (
    <aside className="w-[148px] shrink-0 border-r border-[var(--border)] bg-[var(--bg-sidebar)] flex flex-col min-h-0">
      <div className="px-2 py-1.5 border-b border-[var(--border)] flex items-center justify-between gap-1">
        <span className="text-[8px] font-medium text-[var(--text-muted)] uppercase tracking-wide">
          Explorer
        </span>
        <div className="flex items-center gap-0.5 text-[var(--text-muted)]">
          <FolderPlus className="w-2.5 h-2.5" />
          <FilePlus className="w-2.5 h-2.5" />
        </div>
      </div>
      <div className="p-1.5">
        <div className="flex items-center gap-1 px-1.5 py-1 rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] text-[8px] text-[var(--text-muted)]">
          <Search className="w-2.5 h-2.5 shrink-0" />
          <span className="truncate">Search…</span>
        </div>
      </div>
      <div className="flex-1 overflow-hidden px-1 pb-1 space-y-0.5 text-[8px]">
        <div className="flex items-center gap-1 px-1.5 py-1 rounded-md text-[var(--text-secondary)] font-medium">
          <ChevronDown className="w-2.5 h-2.5 text-[var(--text-muted)]" />
          <BookOpen className="w-2.5 h-2.5 text-[var(--text-muted)]" />
          <span className="truncate">Methods</span>
        </div>
        <div
          className={`flex items-center gap-1 pl-5 pr-1.5 py-1 rounded-md truncate ${
            activePage === "course-reader.pdf"
              ? "bg-[var(--accent-subtle)] text-[var(--accent)] font-medium"
              : "text-[var(--text-muted)]"
          }`}
        >
          <FileText className="w-2.5 h-2.5 shrink-0" />
          course-reader.pdf
        </div>
        <div
          className={`flex items-center gap-1 pl-5 pr-1.5 py-1 rounded-md truncate ${
            activePage === "chapter-notes"
              ? "bg-[var(--accent-subtle)] text-[var(--accent)] font-medium"
              : "text-[var(--text-muted)]"
          }`}
        >
          <NotebookPen className="w-2.5 h-2.5 shrink-0" />
          Chapter notes
        </div>
        <div className="flex items-center gap-1 pl-5 pr-1.5 py-1 rounded-md text-[var(--text-muted)] truncate">
          <FileText className="w-2.5 h-2.5 shrink-0" />
          Essay outline — doc
        </div>
        <div className="flex items-center gap-1 px-1.5 py-1 rounded-md text-[var(--text-secondary)] font-medium mt-1">
          <ChevronDown className="w-2.5 h-2.5 text-[var(--text-muted)] rotate-[-90deg]" />
          <BookOpen className="w-2.5 h-2.5 text-[var(--text-muted)]" />
          <span className="truncate">Current affairs</span>
        </div>
        <div className="flex items-center gap-1 px-1.5 py-1 rounded-md text-[var(--text-muted)] truncate">
          <FileText className="w-2.5 h-2.5 shrink-0" />
          weekly-brief.pdf
        </div>
      </div>
    </aside>
  );
}

export function SlideLibraryHome() {
  return (
    <div className="landing-app-preview h-full flex flex-col">
      <LandingAppPreviewChrome activeNav="library" />
      <div className="flex flex-1 min-h-0">
        <ExplorerSidebar />
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-4 bg-[var(--bg-primary)] min-w-0">
          <div className="w-full max-w-[260px] flex flex-col items-center">
            <ShelfLogo size={32} />
            <p className="mt-3 text-[13px] font-semibold text-[var(--text-primary)] tracking-tight">
              Good evening, Alex
            </p>
            <p className="mt-1 text-[8px] text-[var(--text-muted)] text-center leading-relaxed">
              Search your library or pick up where you left off.
            </p>
            <div className="mt-3 w-full flex items-center gap-2 px-2.5 py-2 rounded-[8px] border border-[var(--accent)]/30 bg-[var(--accent-subtle)] text-left">
              <BookOpen className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
              <span className="min-w-0">
                <span className="block text-[8px] font-medium text-[var(--text-primary)]">
                  Continue reading
                </span>
                <span className="block text-[7px] text-[var(--text-muted)] truncate">
                  course-reader.pdf · Methods
                </span>
              </span>
            </div>
            <div className="relative w-full mt-2.5">
              <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <div className="w-full pl-8 pr-2 py-2 rounded-[8px] bg-[var(--bg-elevated)] border border-[var(--border)] text-[8px] text-[var(--text-muted)]">
                Search across all folders…
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1.5 w-full mt-2.5">
              <div className="flex items-start gap-1.5 px-2 py-2 rounded-[8px] border border-[var(--border)] bg-[var(--bg-secondary)] text-left">
                <FolderPlus className="w-3 h-3 text-[var(--accent)] shrink-0 mt-0.5" />
                <span>
                  <span className="block text-[8px] font-medium text-[var(--text-primary)]">
                    New folder
                  </span>
                  <span className="block text-[7px] text-[var(--text-muted)] leading-snug">
                    Group folders and files
                  </span>
                </span>
              </div>
              <div className="flex items-start gap-1.5 px-2 py-2 rounded-[8px] border border-[var(--border)] bg-[var(--bg-secondary)] text-left">
                <FilePlus className="w-3 h-3 text-[var(--accent)] shrink-0 mt-0.5" />
                <span>
                  <span className="block text-[8px] font-medium text-[var(--text-primary)]">
                    Add file
                  </span>
                  <span className="block text-[7px] text-[var(--text-muted)] leading-snug">
                    PDF, notes, or link
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
        <ExplorerSidebar activePage="course-reader.pdf" />
        <div className="flex-1 flex flex-col min-w-0 bg-[var(--bg-primary)]">
          <div className="shrink-0 border-b border-[var(--border)] bg-[var(--bg-secondary)] px-1.5 min-h-[28px] flex items-center gap-1">
            <span className="flex items-center gap-1 max-w-[130px] min-w-0 shrink-0 rounded-md px-1.5 py-1 text-[8px] bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] truncate">
              <FileText className="w-2.5 h-2.5 text-[var(--accent)] shrink-0" />
              course-reader.pdf
            </span>
            <span className="flex items-center gap-1 max-w-[100px] min-w-0 rounded-md px-1.5 py-1 text-[8px] text-[var(--text-muted)] truncate">
              <NotebookPen className="w-2.5 h-2.5 shrink-0" />
              Chapter notes
            </span>
          </div>
          <div className="flex flex-1 min-h-0">
            <div className="flex-1 flex flex-col min-w-0">
              <div className="flex-1 overflow-hidden p-2.5 bg-[var(--bg-secondary)]">
                <div className="h-full rounded-[6px] border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2.5 text-[9px] leading-relaxed text-[var(--text-secondary)] font-[family-name:var(--font-serif)] shadow-sm">
                  <p className="font-semibold text-[var(--text-primary)] text-[10px] mb-1.5">
                    Section 2 — Core concepts
                  </p>
                  <p className="mb-1.5">
                    The framework distinguishes between descriptive and normative
                    claims.{" "}
                    <mark className="landing-highlight">
                      A normative claim states what ought to be, not merely what is.
                    </mark>
                  </p>
                  <p className="text-[8px] text-[var(--text-muted)]">
                    Your notes should separate evidence from interpretation before
                    you ask Study AI.
                  </p>
                </div>
              </div>
              <div className="reader-bottom-bar border-t border-[var(--border)] bg-[var(--bg-primary)]/90 px-2 py-1.5 flex items-center justify-between shrink-0">
                <button type="button" className="flex items-center gap-0.5 text-[8px] text-[var(--text-muted)]">
                  <ChevronLeft className="w-3 h-3" />
                  <span>Page 4</span>
                </button>
                <div className="flex items-center gap-1">
                  <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[8px] text-[var(--accent)] bg-[var(--accent-light)]">
                    <Highlighter className="w-2.5 h-2.5" />
                    Highlight
                  </span>
                  <span className="flex items-center gap-0.5 px-1 py-0.5 rounded-md text-[8px] text-[var(--text-muted)]">
                    <Star className="w-2.5 h-2.5" />
                  </span>
                  <span className="flex items-center gap-0.5 px-1 py-0.5 rounded-md text-[8px] text-[var(--text-muted)]">
                    <CalendarDays className="w-2.5 h-2.5" />
                    Schedule
                  </span>
                </div>
                <button type="button" className="flex items-center gap-0.5 text-[8px] text-[var(--text-muted)]">
                  <span>Page 6</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
            <aside className="w-[132px] shrink-0 border-l border-[var(--border)] bg-[var(--bg-primary)] hidden sm:flex flex-col min-h-0">
              <div className="px-2 py-1.5 border-b border-[var(--border)] flex items-center gap-1 text-[8px] font-medium text-[var(--accent)]">
                <Sparkles className="w-2.5 h-2.5" />
                Study AI
              </div>
              <div className="flex-1 p-1.5 space-y-1.5 overflow-hidden">
                <div className="rounded-md bg-[var(--bg-secondary)] border border-[var(--border)] px-1.5 py-1 text-[7px] text-[var(--text-muted)]">
                  Selection
                  <p className="mt-0.5 text-[var(--text-secondary)] line-clamp-2">
                    A normative claim states what ought to be…
                  </p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {["Summarize", "Notes", "Ask"].map((label) => (
                    <span
                      key={label}
                      className="px-1.5 py-0.5 rounded-full border border-[var(--border)] text-[7px] text-[var(--text-muted)]"
                    >
                      {label}
                    </span>
                  ))}
                </div>
                <div className="rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] px-1.5 py-1.5 text-[7.5px] leading-snug text-[var(--text-secondary)]">
                  Normative claims prescribe; keep them distinct from evidence when
                  revising.
                </div>
              </div>
              <div className="border-t border-[var(--border)] p-1.5">
                <div className="input-pill text-[7px] text-[var(--text-muted)] py-1.5 px-2">
                  Ask about this page…
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
        <aside className="w-[108px] shrink-0 border-r border-[var(--border)] bg-[var(--bg-sidebar)] p-1.5 hidden sm:flex flex-col gap-1">
          <div className="text-[8px] font-medium text-[var(--text-muted)] px-1 mb-0.5">
            Chats
          </div>
          <div className="px-1.5 py-1.5 rounded-md bg-[var(--accent-subtle)] text-[var(--accent)] text-[8px] font-medium truncate">
            Chapter revision
          </div>
          <div className="px-1.5 py-1.5 rounded-md text-[8px] text-[var(--text-muted)] truncate">
            Syllabus Q&amp;A
          </div>
          <div className="px-1.5 py-1.5 rounded-md text-[8px] text-[var(--text-muted)] truncate">
            Flashcards draft
          </div>
        </aside>
        <div className="flex-1 flex flex-col min-w-0 bg-[var(--bg-primary)]">
          <div className="px-2.5 py-1.5 border-b border-[var(--border)] flex items-center justify-between">
            <span className="text-[9px] font-medium text-[var(--text-primary)]">
              Chapter revision
            </span>
            <span className="text-[7px] text-[var(--text-muted)]">
              Scope · Methods
            </span>
          </div>
          <div className="flex-1 p-2.5 space-y-2 overflow-hidden">
            <div className="ml-auto rounded-[8px] bg-[var(--accent-subtle)] border border-[var(--border)] px-2 py-1.5 text-[8px] text-[var(--text-secondary)] max-w-[82%]">
              Compare my notes with the PDF. What am I missing?
            </div>
            <div className="rounded-[8px] border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-1.5 text-[8px] text-[var(--text-secondary)] leading-relaxed max-w-[94%]">
              <span className="inline-flex items-center gap-0.5 text-[var(--accent)] mb-0.5">
                <Sparkles className="w-2.5 h-2.5" />
                Study AI
              </span>
              <p>
                Your notes cover the broad ideas; the PDF adds methodology and
                citation details worth folding in before revision.
              </p>
              <p className="text-[7px] text-[var(--accent)] mt-1 font-medium">
                course-reader.pdf · Chapter notes
              </p>
            </div>
          </div>
          <div className="border-t border-[var(--border)] p-2">
            <div className="input-pill text-[8px] text-[var(--text-muted)] py-2 px-3">
              Ask Study AI…
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
        <div className="w-full max-w-[260px] rounded-[10px] border border-[var(--border)] bg-[var(--bg-elevated)] p-3.5 shadow-sm">
          <p className="text-[11px] font-semibold text-[var(--text-primary)]">
            Study goal
          </p>
          <p className="text-[8px] text-[var(--text-muted)] mt-0.5">
            Optional — Settings → study goal
          </p>
          <div className="grid grid-cols-2 gap-1.5 mt-2.5">
            {["Learn a subject", "Research project", "Build expertise", "Assessment prep"].map(
              (label, i) => (
                <div
                  key={label}
                  className={`px-2 py-1.5 rounded-[8px] border text-[8px] ${
                    i === 2
                      ? "border-[var(--accent)] bg-[var(--accent-subtle)] text-[var(--accent)] font-medium"
                      : "border-[var(--border)] text-[var(--text-secondary)]"
                  }`}
                >
                  {label}
                </div>
              )
            )}
          </div>
          <div className="mt-2.5 rounded-[8px] border border-[var(--accent)]/30 bg-[var(--accent-subtle)] p-2 text-[7.5px] text-[var(--text-secondary)] leading-snug">
            <span className="font-medium text-[var(--accent)]">Goal active</span>
            <p className="mt-0.5">
              Study AI and planner stay aligned to your focus.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
