import {
  BookOpen,
  CalendarDays,
  LayoutDashboard,
  ListChecks,
  MessageSquareText,
  Moon,
  Search,
  Sparkles,
  Star,
  ChevronLeft,
  ChevronRight,
  FilePlus,
  FolderPlus,
  FileText,
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
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-1.5 shrink-0">
          <ShelfLogo size={18} />
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
                  ? "nav-link-active bg-[var(--bg-elevated)] text-[var(--text-primary)]"
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
          <Moon className="w-3 h-3" />
        </span>
        <span className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-[var(--accent-subtle)] text-[var(--accent)] text-[8px] font-medium">
          <Sparkles className="w-2.5 h-2.5" />
          Upgrade
        </span>
        <span className="w-6 h-6 rounded-full bg-[var(--accent)] text-white text-[8px] font-medium flex items-center justify-center">
          A
        </span>
      </div>
    </div>
  );
}

function ExplorerSidebar({
  activePage,
}: {
  activePage?: string;
}) {
  return (
    <aside className="w-[132px] shrink-0 border-r border-[var(--border)] bg-[var(--bg-sidebar)] flex flex-col min-h-0">
      <div className="px-2 py-1.5 border-b border-[var(--border)] flex items-center justify-between gap-1">
        <span className="text-[8px] font-medium text-[var(--text-muted)] uppercase tracking-wide">
          Explorer
        </span>
      </div>
      <div className="p-1.5">
        <div className="flex items-center gap-1 px-1.5 py-1 rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] text-[8px] text-[var(--text-muted)]">
          <Search className="w-2.5 h-2.5 shrink-0" />
          <span className="truncate">Search…</span>
        </div>
      </div>
      <div className="flex-1 overflow-hidden px-1 pb-1 space-y-0.5 text-[8px]">
        <div className="flex items-center gap-1 px-1.5 py-1 rounded-md text-[var(--text-secondary)] font-medium">
          <BookOpen className="w-2.5 h-2.5 text-[var(--text-muted)]" />
          <span className="truncate">Methods</span>
        </div>
        <div
          className={`flex items-center gap-1 pl-4 pr-1.5 py-1 rounded-md truncate ${
            activePage === "course-reader.pdf"
              ? "bg-[var(--accent-subtle)] text-[var(--accent)]"
              : "text-[var(--text-muted)]"
          }`}
        >
          <FileText className="w-2.5 h-2.5 shrink-0" />
          course-reader.pdf
        </div>
        <div
          className={`flex items-center gap-1 pl-4 pr-1.5 py-1 rounded-md truncate ${
            activePage === "chapter-notes"
              ? "bg-[var(--accent-subtle)] text-[var(--accent)]"
              : "text-[var(--text-muted)]"
          }`}
        >
          <FileText className="w-2.5 h-2.5 shrink-0" />
          Chapter notes
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
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-3 bg-[var(--bg-primary)] min-w-0">
          <ShelfLogo size={28} />
          <p className="mt-2 text-[11px] font-semibold text-[var(--text-primary)] tracking-tight">
            Good evening
          </p>
          <p className="mt-1 text-[8px] text-[var(--text-muted)] text-center">
            Search your library or add material.
          </p>
          <div className="relative w-full max-w-[200px] mt-3">
            <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <div className="w-full pl-7 pr-2 py-1.5 rounded-[8px] bg-[var(--bg-elevated)] border border-[var(--border)] text-[8px] text-[var(--text-muted)]">
              Search across all collections…
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1.5 w-full max-w-[200px] mt-2">
            <div className="flex items-center gap-1 px-2 py-1.5 rounded-[8px] border border-[var(--border)] bg-[var(--bg-elevated)] text-[8px] text-[var(--text-secondary)]">
              <FolderPlus className="w-3 h-3 text-[var(--accent)]" />
              New folder
            </div>
            <div className="flex items-center gap-1 px-2 py-1.5 rounded-[8px] border border-[var(--border)] bg-[var(--bg-elevated)] text-[8px] text-[var(--text-secondary)]">
              <FilePlus className="w-3 h-3 text-[var(--accent)]" />
              Add file
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
          <div className="shrink-0 border-b border-[var(--border)] bg-[var(--bg-secondary)] px-1 min-h-[28px] flex items-center">
            <span className="flex items-center gap-1 max-w-[120px] min-w-0 shrink-0 rounded-md px-1.5 py-1 text-[8px] bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] truncate">
              course-reader.pdf
            </span>
          </div>
          <div className="flex-1 overflow-hidden p-3 bg-[var(--bg-secondary)]">
            <div className="h-full rounded-[6px] border border-[var(--border)] bg-[var(--bg-elevated)] p-3 text-[9px] leading-relaxed text-[var(--text-secondary)] font-[family-name:var(--font-serif)]">
              <p className="font-semibold text-[var(--text-primary)] text-[10px] mb-1.5">
                Section 2 — Core concepts
              </p>
              <p>
                The framework distinguishes between descriptive and normative
                claims.{" "}
                <mark className="landing-highlight">
                  A normative claim states what ought to be, not merely what is.
                </mark>{" "}
                Your notes should separate evidence from interpretation.
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
                <Sparkles className="w-2.5 h-2.5" />
                Study AI
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
      </div>
    </div>
  );
}

export function SlideStudyAi() {
  return (
    <div className="landing-app-preview h-full flex flex-col">
      <LandingAppPreviewChrome activeNav="study-ai" />
      <div className="flex flex-1 min-h-0">
        <aside className="w-[88px] shrink-0 border-r border-[var(--border)] bg-[var(--bg-sidebar)] p-1.5 hidden sm:block">
          <div className="text-[8px] font-medium text-[var(--text-muted)] px-1 mb-1">Chats</div>
          <div className="px-1.5 py-1 rounded-md bg-[var(--accent-subtle)] text-[var(--accent)] text-[8px] font-medium truncate">
            Chapter revision
          </div>
          <div className="px-1.5 py-1 text-[8px] text-[var(--text-muted)] truncate">Syllabus Q&amp;A</div>
        </aside>
        <div className="flex-1 flex flex-col min-w-0 bg-[var(--bg-primary)]">
          <div className="flex-1 p-2 space-y-2 overflow-hidden">
            <div className="rounded-[8px] bg-[var(--accent-subtle)] border border-[var(--border)] px-2 py-1.5 text-[8px] text-[var(--text-secondary)] max-w-[85%]">
              Compare my notes with the PDF. What am I missing?
            </div>
            <div className="rounded-[8px] border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-1.5 text-[8px] text-[var(--text-secondary)] leading-relaxed max-w-[92%]">
              <span className="inline-flex items-center gap-0.5 text-[var(--accent)] mb-0.5">
                <Sparkles className="w-2.5 h-2.5" />
                Study AI
              </span>
              <p>
                Your notes cover the broad ideas; the PDF adds more on methodology
                and citations worth folding in.
              </p>
              <p className="text-[7px] text-[var(--accent)] mt-1 font-medium">
                course-reader.pdf · Chapter notes
              </p>
            </div>
          </div>
          <div className="border-t border-[var(--border)] p-1.5">
            <div className="input-pill text-[8px] text-[var(--text-muted)] py-1.5 px-2.5">
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
        <div className="w-full max-w-[240px] rounded-[10px] border border-[var(--border)] bg-[var(--bg-elevated)] p-3 shadow-sm">
          <p className="text-[10px] font-semibold text-[var(--text-primary)]">
            Study goal
          </p>
          <p className="text-[8px] text-[var(--text-muted)] mt-0.5">
            Optional — Settings → study goal
          </p>
          <div className="grid grid-cols-2 gap-1 mt-2">
            {["Learn a subject", "Research project", "Build expertise", "Assessment prep"].map(
              (label, i) => (
                <div
                  key={label}
                  className={`px-1.5 py-1 rounded-[8px] border text-[7px] ${
                    i === 2
                      ? "border-[var(--accent)] bg-[var(--accent-subtle)] text-[var(--accent)]"
                      : "border-[var(--border)] text-[var(--text-secondary)]"
                  }`}
                >
                  {label}
                </div>
              )
            )}
          </div>
          <div className="mt-2 rounded-[8px] border border-[var(--accent)]/30 bg-[var(--accent-subtle)] p-2 text-[7px] text-[var(--text-secondary)]">
            <span className="font-medium text-[var(--accent)]">Goal active</span>
            <p className="mt-0.5">Study AI and planner can stay aligned to your focus.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
