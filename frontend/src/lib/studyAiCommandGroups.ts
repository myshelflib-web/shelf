import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Brain,
  FileText,
  GraduationCap,
  Lightbulb,
  ListTree,
  Network,
  ScrollText,
  Sparkles,
  Timer,
} from "lucide-react";
import type { StudyAiCommand, StudyAiCommandScope } from "@/lib/studyAiCommands";
import { STUDY_AI_COMMANDS } from "@/lib/studyAiCommands";

export type StudyAiCommandGroup = {
  id: string;
  label: string;
  icon: LucideIcon;
  slashes: string[];
};

export const STUDY_AI_COMMAND_GROUPS: StudyAiCommandGroup[] = [
  {
    id: "revise",
    label: "Revise",
    icon: ListTree,
    slashes: [
      "summarize",
      "deep-summary",
      "notes",
      "chapter-notes",
      "mindmap",
      "recap",
    ],
  },
  {
    id: "understand",
    label: "Understand",
    icon: Lightbulb,
    slashes: ["explain", "eli5", "define", "example", "analyze"],
  },
  {
    id: "exam",
    label: "Exam prep",
    icon: GraduationCap,
    slashes: ["quiz", "flashcards", "pyq", "mains", "outline"],
  },
  {
    id: "organize",
    label: "Organize",
    icon: ScrollText,
    slashes: [
      "plan",
      "compare",
      "timeline",
      "formula",
      "mnemonic",
      "gaps",
      "cite",
    ],
  },
];

const COMMAND_ICONS: Record<string, LucideIcon> = {
  summarize: ListTree,
  "deep-summary": BookOpen,
  notes: FileText,
  "chapter-notes": ScrollText,
  mindmap: Network,
  recap: Timer,
  explain: Lightbulb,
  eli5: Sparkles,
  define: BookOpen,
  example: Lightbulb,
  analyze: Brain,
  quiz: GraduationCap,
  flashcards: Sparkles,
  pyq: GraduationCap,
  mains: ScrollText,
  outline: ListTree,
  plan: Timer,
  compare: ListTree,
  timeline: Timer,
  formula: BookOpen,
  mnemonic: Sparkles,
  gaps: FileText,
  cite: FileText,
};

export function commandIcon(slash: string): LucideIcon {
  return COMMAND_ICONS[slash] ?? Sparkles;
}

export function groupedCommands(
  _scope: StudyAiCommandScope
): Array<{ group: StudyAiCommandGroup; commands: StudyAiCommand[] }> {
  const bySlash = new Map(
    STUDY_AI_COMMANDS.filter((c) => c.slash !== "help").map((c) => [c.slash, c])
  );

  return STUDY_AI_COMMAND_GROUPS.map((group) => ({
    group,
    commands: group.slashes
      .map((s) => bySlash.get(s))
      .filter((c): c is StudyAiCommand => Boolean(c)),
  })).filter((g) => g.commands.length > 0);
}
