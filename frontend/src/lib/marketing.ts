import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  CalendarDays,
  Columns2,
  FileUp,
  Highlighter,
  LayoutDashboard,
  ListChecks,
  Map,
  MessageSquareText,
  NotebookPen,
  Target,
} from "lucide-react";

export interface MarketingFeature {
  icon: LucideIcon;
  title: string;
  body: string;
}

export const MARKETING_FEATURES: MarketingFeature[] = [
  {
    icon: FileUp,
    title: "Upload notes and PDFs",
    body: "Bring your own files into private sections. Free accounts get 100 MB; paid plans add more storage and Study AI tokens.",
  },
  {
    icon: NotebookPen,
    title: "Sketch notebooks & doc pages",
    body: "Create multi-sheet sketch notebooks or typed doc pages in the same collection as your PDFs — not a separate notes app.",
  },
  {
    icon: Columns2,
    title: "Tabs and split view",
    body: "Open up to 15 pages in tabs, compare two documents side by side, and resize library and Study AI panels.",
  },
  {
    icon: Highlighter,
    title: "Highlight as you read",
    body: "Mark passages on pages you uploaded. Colors stay with the page for later revision.",
  },
  {
    icon: MessageSquareText,
    title: "Ask on a selection or the page",
    body: "Highlight a paragraph or ask about the whole page. Study AI answers from your material.",
  },
  {
    icon: Map,
    title: "Summarize, notes, mind maps",
    body: "Turn a long page into a recap, revision bullets, or a scannable mind map.",
  },
  {
    icon: Target,
    title: "Goal-aware Study AI",
    body: "Pick a study track so answers stay relevant to what you are working toward.",
  },
  {
    icon: ListChecks,
    title: "Exam-style quiz",
    body: "Sit MCQs, written answers, and photos of working from a page, upload, or PYQ-style bank.",
  },
  {
    icon: LayoutDashboard,
    title: "Dashboard and calendar",
    body: "Track usage, set a goal, and add tasks or events that link back to your pages.",
  },
  {
    icon: CalendarDays,
    title: "Plan the week",
    body: "Daily, weekly, and monthly views. Click a linked item to open that page in your library.",
  },
  {
    icon: BookOpen,
    title: "Your sections",
    body: "Group uploads into sections — like folders — and open any page whenever you need it.",
  },
];
