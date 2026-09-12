import type { LucideIcon } from "lucide-react";
import {
  BookMarked,
  BookOpen,
  Brain,
  CalendarDays,
  Columns2,
  FileText,
  Flame,
  GraduationCap,
  Highlighter,
  Keyboard,
  LayoutDashboard,
  Library,
  ListChecks,
  Map,
  MessageSquareText,
  Music,
  NotebookPen,
  Scale,
  ScanSearch,
  Search,
  Send,
  Share2,
  Sparkles,
  Target,
  WifiOff,
  Youtube,
} from "lucide-react";
import type { FeatureCategoryId } from "./featureTypes";

const BY_SLUG: Record<string, LucideIcon> = {
  "all-in-one-study-workspace": LayoutDashboard,
  "notes-pdfs-ask-llm": MessageSquareText,
  "personal-library": Library,
  "pdf-highlights": Highlighter,
  "reader-workspace": Columns2,
  "library-search": Search,
  "sketch-notes": NotebookPen,
  "pin-continue-reading": BookOpen,
  "youtube-lectures": Youtube,
  "research-doc-writing": BookMarked,
  "writing-assist-originality": ScanSearch,
  "chat-with-pdf": FileText,
  "ai-tutor": Sparkles,
  "study-ai": Sparkles,
  "study-ai-page-ask": MessageSquareText,
  "study-ai-library-chat": Brain,
  "study-ai-summaries": FileText,
  "study-ai-depth-modes": Target,
  "goal-aware-study-ai": Target,
  "study-ai-chat-controls": MessageSquareText,
  "study-ai-actions": Sparkles,
  "ai-flashcards-quizzes": ListChecks,
  "teacher-test-prep": GraduationCap,
  "exam-quiz": ListChecks,
  "planner-calendar": CalendarDays,
  "dashboard-streak": Flame,
  "study-streak-share-cards": Share2,
  "telegram-pdf-import": Send,
  "spotify-focus-audio": Music,
  "document-sharing": Share2,
  "pwa-offline": WifiOff,
  "cross-device-sync": LayoutDashboard,
  "keyboard-shortcuts": Keyboard,
  "free-curriculum": GraduationCap,
  "shelf-premium": Sparkles,
  "shelf-vs-alternatives": Scale,
};

const BY_CATEGORY: Record<FeatureCategoryId, LucideIcon> = {
  library: Library,
  "study-ai": Sparkles,
  practice: ListChecks,
  integrations: Share2,
  platform: LayoutDashboard,
};

export function iconForFeature(
  slug: string,
  category: FeatureCategoryId
): LucideIcon {
  return BY_SLUG[slug] ?? BY_CATEGORY[category] ?? BookOpen;
}
