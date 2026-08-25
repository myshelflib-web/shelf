import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  CalendarDays,
  FileUp,
  Highlighter,
  LayoutDashboard,
  Map,
  MessageSquareText,
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
    body: "Bring your own files into private sections. Free accounts get 250 MB; paid plans add more storage and Study AI tokens.",
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
