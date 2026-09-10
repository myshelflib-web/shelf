import type { TourSurface } from "./storage";

export type TourPlacement = "top" | "bottom" | "left" | "right" | "auto";

export interface TourStep {
  id: string;
  /** Matches `data-tour-id` on the target control. */
  targetId: string;
  title: string;
  body: string;
  placement?: TourPlacement;
}

/** Shared header tips prepended to the Library tour (first signed-in surface). */
export const HEADER_TOUR_STEPS: TourStep[] = [
  {
    id: "hdr-search",
    targetId: "hdr-search",
    title: "Command search",
    body: "Press ⌘K or / to search your library and jump into Study AI from anywhere.",
  },
  {
    id: "hdr-shortcuts",
    targetId: "hdr-shortcuts",
    title: "Keyboard shortcuts",
    body: "Open the cheatsheet anytime with ?. Use g then a letter to go, or c to create.",
  },
  {
    id: "hdr-streak",
    targetId: "hdr-streak",
    title: "Streak calendar",
    body: "Your reading streak and month activity live here, plus medals as you stay consistent.",
  },
  {
    id: "hdr-notifications",
    targetId: "hdr-notifications",
    title: "Open-task alerts",
    body: "See tasks due in the next 7 days and overdue items — tap through to the planner.",
  },
];

export const LIBRARY_TOUR_STEPS: TourStep[] = [
  {
    id: "lib-add-file",
    targetId: "lib-add-file",
    title: "Add a file",
    body: "Upload PDFs, create notes, notebooks, Docs, or paste YouTube and links.",
  },
  {
    id: "lib-add-folder",
    targetId: "lib-add-folder",
    title: "New folder",
    body: "Create a collection to group topics and pages in your personal library.",
  },
  {
    id: "lib-select-mode",
    targetId: "lib-select-mode",
    title: "Bulk select",
    body: "Turn on select mode to delete several items at once.",
  },
  {
    id: "lib-mode-tabs",
    targetId: "lib-mode-tabs",
    title: "Personal vs Preloaded",
    body: "Switch between your library and catalog materials in the same explorer.",
  },
  {
    id: "lib-empty-search",
    targetId: "lib-empty-search",
    title: "Search whole library",
    body: "From the empty workspace, search across all folders without opening the command palette.",
  },
];

export const DASHBOARD_TOUR_STEPS: TourStep[] = [
  {
    id: "dash-ask",
    targetId: "dash-ask",
    title: "Search or ask AI",
    body: "Find pages in your library, or press Enter with no hit to start Study AI.",
  },
  {
    id: "dash-continue",
    targetId: "dash-continue",
    title: "Resume reading",
    body: "Jump back to the last page you were on — PDF page included when known.",
  },
  {
    id: "dash-next-up",
    targetId: "dash-next-up",
    title: "Next up",
    body: "Up to two planner actionables for today. Open the full planner for the rest.",
  },
  {
    id: "dash-add-material",
    targetId: "dash-add-material",
    title: "Add material",
    body: "Bring PDFs and notes into Shelf the same way you do from the Library.",
  },
  {
    id: "dash-achievements",
    targetId: "dash-achievements",
    title: "Streak achievements",
    body: "Eight badges unlock as you build a reading habit.",
  },
];

export const PLANNER_TOUR_STEPS: TourStep[] = [
  {
    id: "planner-view-toggle",
    targetId: "planner-view-toggle",
    title: "Week vs month",
    body: "Week board with a To plan backlog, or a no-scroll month grid for this month only.",
  },
  {
    id: "planner-to-plan",
    targetId: "planner-to-plan",
    title: "To plan backlog",
    body: "Unscheduled and overdue tasks live here — drag onto a day to schedule them.",
  },
  {
    id: "planner-create-menu",
    targetId: "planner-create-menu",
    title: "New task or event",
    body: "Tasks link to library pages; events support an optional URL and recurrence.",
  },
  {
    id: "planner-today",
    targetId: "planner-today",
    title: "Jump to today",
    body: "Reset the board cursor to the current day.",
  },
  {
    id: "planner-drag-day",
    targetId: "planner-drag-day",
    title: "Drag to schedule",
    body: "Drop cards between the backlog and day columns (or month cells).",
  },
];

export const STUDY_AI_TOUR_STEPS: TourStep[] = [
  {
    id: "sai-suggest-chips",
    targetId: "sai-suggest-chips",
    title: "Suggestion chips",
    body: "Rotating prompts above the composer — click one to insert a ready-made ask.",
  },
  {
    id: "sai-slash",
    targetId: "sai-slash",
    title: "Slash commands",
    body: "Type / for quiz, flashcards, mind map, and other study tools.",
  },
  {
    id: "sai-attach-sources",
    targetId: "sai-attach-sources",
    title: "Scope & sources",
    body: "Attach images, set library scope (folder/topic/page), or add relevancy docs.",
  },
  {
    id: "sai-tools-menu",
    targetId: "sai-tools-menu",
    title: "Tools menu",
    body: "Browse slash tools without typing /.",
  },
  {
    id: "sai-web-search",
    targetId: "sai-web-search",
    title: "Web search",
    body: "Off keeps answers on your library; on may use Google when needed.",
  },
];

export const READER_TOUR_STEPS: TourStep[] = [
  {
    id: "reader-study-ai-panel",
    targetId: "reader-study-ai-panel",
    title: "Study AI panel",
    body: "Toggle the right panel (⌘J). Select text and press ⌘L to ask about it.",
  },
  {
    id: "reader-pdf-modes",
    targetId: "reader-pdf-modes",
    title: "Annotate modes",
    body: "Select text, ink with the pen, highlight strokes, or erase — switch modes in the toolbar.",
  },
  {
    id: "reader-schedule",
    targetId: "reader-schedule",
    title: "Schedule reading",
    body: "Add this page to the planner as a task (shortcut s).",
  },
  {
    id: "reader-spotify",
    targetId: "reader-spotify",
    title: "Focus audio",
    body: "Paste a Spotify playlist or track. Hiding the dock keeps audio playing.",
  },
  {
    id: "reader-split",
    targetId: "reader-split",
    title: "Split view",
    body: "Open a second pane side-by-side once another page is open (⌘\\).",
  },
  {
    id: "reader-star-share",
    targetId: "reader-star-share",
    title: "Star and share",
    body: "Star for later, or share a link / send the PDF to Telegram.",
  },
];

export function stepsForSurface(surface: TourSurface): TourStep[] {
  switch (surface) {
    case "library":
      return [...HEADER_TOUR_STEPS, ...LIBRARY_TOUR_STEPS];
    case "dashboard":
      return DASHBOARD_TOUR_STEPS;
    case "planner":
      return PLANNER_TOUR_STEPS;
    case "study-ai":
      return STUDY_AI_TOUR_STEPS;
    case "reader":
      return READER_TOUR_STEPS;
    default:
      return [];
  }
}
