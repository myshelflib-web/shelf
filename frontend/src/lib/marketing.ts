import type { LucideIcon } from "lucide-react";
import {
  BookMarked,
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
  ScanSearch,
  Send,
  Target,
  Youtube,
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
    icon: Send,
    title: "Telegram import and send",
    body: "Forward coaching PDFs to the Shelf bot, then send a library PDF back from Share — same reader, highlights, and Study AI as in-app uploads.",
  },
  {
    icon: NotebookPen,
    title: "Sketch notebooks & research Docs",
    body: "Create multi-sheet sketch notebooks or typed Docs in the same collection as your PDFs — with citations, outlines, and export for research writing.",
  },
  {
    icon: BookMarked,
    title: "Citations & bibliography",
    body: "Cite in APA, MLA, Chicago, or IEEE. Import BibTeX, cite from library highlights, and refresh a References block as you draft.",
  },
  {
    icon: ScanSearch,
    title: "Paraphrase & originality",
    body: "Rewrite selections in your own words and check overlap with your library and syllabus. Premium can run web plagiarism when a vendor key is set.",
  },
  {
    icon: Youtube,
    title: "YouTube lectures",
    body: "Paste a video or playlist into your library. Watch in the reader, stamp timestamps into notes, and split a PDF beside the lecture.",
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
