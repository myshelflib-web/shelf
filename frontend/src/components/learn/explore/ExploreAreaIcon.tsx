import {
  BookOpen,
  Building2,
  FlaskConical,
  GraduationCap,
  Scale,
  Wrench,
} from "lucide-react";
import type { ExploreAreaTone } from "@/lib/exploreCatalog";

const TONE_CLASS: Record<ExploreAreaTone, string> = {
  exam: "bg-[var(--accent-subtle)] text-[var(--accent)]",
  law: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  med: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  eng: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  policy: "bg-[var(--bg-secondary)] text-[var(--text-muted)]",
  books: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
};

export function ExploreAreaIcon({
  tone,
  size = "md",
}: {
  tone: ExploreAreaTone;
  size?: "sm" | "md";
}) {
  const box =
    size === "sm"
      ? "w-6 h-6 rounded-md"
      : "w-8 h-8 rounded-[9px]";
  const icon = size === "sm" ? "w-3 h-3" : "w-4 h-4";

  const Icon =
    tone === "law"
      ? Scale
      : tone === "med"
        ? FlaskConical
        : tone === "eng"
          ? Wrench
          : tone === "policy"
            ? Building2
            : tone === "books"
              ? BookOpen
              : GraduationCap;

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 ${box} ${TONE_CLASS[tone]}`}
      aria-hidden
    >
      <Icon className={icon} />
    </span>
  );
}
