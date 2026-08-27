import { shelfFieldClass } from "@/lib/ui/fieldClasses";

export const quizFieldClass = shelfFieldClass;

export const quizBtnPrimary =
  "inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-[10px] text-[13px] font-semibold bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] disabled:opacity-50 transition-colors";

export const quizBtnGhost =
  "inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-[10px] text-[13px] font-medium border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-50 transition-colors";
