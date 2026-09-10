import {
  BookOpen,
  CalendarDays,
  FilePlus,
  FileText,
  FolderOpen,
  FolderPlus,
  LayoutDashboard,
  ListChecks,
  MessageSquareText,
  Moon,
  NotebookPen,
  Search,
  Sparkles,
} from "lucide-react";
import { ShelfLogo } from "@/components/ShelfLogo";

export type PreviewNav = "library" | "dashboard" | "planner" | "quiz" | "study-ai";

const NAV: { id: PreviewNav; icon: typeof BookOpen; label: string }[] = [
  { id: "library", icon: BookOpen, label: "Library" },
  { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { id: "planner", icon: CalendarDays, label: "Planner" },
  { id: "quiz", icon: ListChecks, label: "Quiz" },
  { id: "study-ai", icon: MessageSquareText, label: "Study AI" },
];

/** Scaled Header chrome — active = elevated pill, icons always shown. */
export function LandingAppPreviewChrome({ activeNav }: { activeNav: PreviewNav }) {
  return (
    <div className="h-8 shrink-0 border-b border-[var(--border)] bg-[var(--bg-primary)] flex items-center justify-between gap-2 px-2">
      <div className="flex items-center gap-2 min-w-0">
        <div className="flex items-center gap-1 shrink-0">
          <ShelfLogo size={14} />
          <span className="font-semibold text-[10px] tracking-tight text-[var(--text-primary)]">
            Shelf
          </span>
        </div>
        <nav className="hidden sm:flex items-center gap-px min-w-0" aria-hidden>
          {NAV.map(({ id, icon: Icon, label }) => (
            <span
              key={id}
              className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[8px] whitespace-nowrap ${
                activeNav === id
                  ? "bg-[var(--bg-elevated)] text-[var(--text-primary)]"
                  : "text-[var(--text-muted)]"
              }`}
            >
              <Icon className="w-2.5 h-2.5 shrink-0 opacity-80" strokeWidth={1.75} />
              {label}
            </span>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-0.5 shrink-0">
        <span className="p-1 rounded-md text-[var(--text-muted)]" aria-hidden>
          <Search className="w-2.5 h-2.5" strokeWidth={1.75} />
        </span>
        <span className="p-1 rounded-md text-[var(--text-muted)]" aria-hidden>
          <Moon className="w-2.5 h-2.5" strokeWidth={1.75} />
        </span>
        <span className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-[var(--accent-subtle)] text-[var(--accent)] text-[7px] font-medium">
          <Sparkles className="w-2 h-2" />
          Upgrade
        </span>
        <span className="w-[18px] h-[18px] rounded-full bg-[var(--accent)] text-white text-[7px] font-medium flex items-center justify-center ring-1 ring-[var(--border)]">
          A
        </span>
      </div>
    </div>
  );
}

/** Scaled Library explorer sidebar. */
export function LandingPreviewExplorer({ activePage }: { activePage?: string }) {
  return (
    <aside className="w-[136px] shrink-0 border-r border-[var(--border)] bg-[var(--bg-sidebar)] flex flex-col min-h-0">
      <div className="px-1.5 py-1.5 border-b border-[var(--border)] flex items-center justify-between gap-1">
        <span className="flex items-center gap-1 text-[8px] font-semibold text-[var(--text-primary)]">
          <FolderOpen className="w-2.5 h-2.5 text-[var(--text-muted)]" />
          Explorer
        </span>
        <div className="flex items-center gap-0.5 text-[var(--text-muted)]">
          <FilePlus className="w-2.5 h-2.5" />
          <FolderPlus className="w-2.5 h-2.5" />
        </div>
      </div>
      <div className="px-1.5 pt-1.5">
        <div className="flex items-center gap-1 px-1.5 py-1 rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] text-[7.5px] text-[var(--text-muted)]">
          <Search className="w-2.5 h-2.5 shrink-0" />
          <span className="truncate">Search folders…</span>
        </div>
      </div>
      <div className="flex-1 overflow-hidden px-1 py-1 space-y-px text-[7.5px]">
        <div className="flex items-center gap-1 px-1.5 py-1 rounded-md text-[var(--text-secondary)] font-medium">
          <BookOpen className="w-2.5 h-2.5 text-[var(--text-muted)]" />
          <span className="truncate">Methods</span>
        </div>
        {(
          [
            ["course-reader.pdf", FileText],
            ["chapter-notes", NotebookPen],
            ["Essay outline — doc", FileText],
          ] as const
        ).map(([name, Icon]) => (
          <div
            key={name}
            className={`flex items-center gap-1 pl-4 pr-1 py-1 rounded-md truncate ${
              activePage === name
                ? "bg-[var(--bg-elevated)] text-[var(--text-primary)] font-medium"
                : "text-[var(--text-muted)]"
            }`}
          >
            <Icon className="w-2.5 h-2.5 shrink-0" />
            {name === "chapter-notes" ? "Chapter notes" : name}
          </div>
        ))}
        <div className="flex items-center gap-1 px-1.5 py-1 rounded-md text-[var(--text-secondary)] font-medium mt-0.5">
          <BookOpen className="w-2.5 h-2.5 text-[var(--text-muted)]" />
          <span className="truncate">Current affairs</span>
        </div>
        <div className="flex items-center gap-1 pl-4 pr-1 py-1 rounded-md text-[var(--text-muted)] truncate">
          <FileText className="w-2.5 h-2.5 shrink-0" />
          weekly-brief.pdf
        </div>
      </div>
    </aside>
  );
}
