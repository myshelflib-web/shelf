"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Brain, Gauge, Lock, Zap } from "lucide-react";
import {
  type StudyDepth,
  STUDY_DEPTH_OPTIONS,
  setStoredStudyDepth,
} from "@/lib/studyDepth";
import { positionMenuBelow } from "@/lib/ui/positionMenuBelow";

const DEPTH_ICONS: Record<StudyDepth, typeof Zap> = {
  quick: Zap,
  standard: Gauge,
  deep: Brain,
};

export function StudyAiThinkingMenu({
  value,
  onChange,
  isPremium,
  disabled,
  compact,
}: {
  value: StudyDepth;
  onChange: (depth: StudyDepth) => void;
  isPremium: boolean;
  disabled?: boolean;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => setMounted(true), []);

  const close = useCallback(() => setOpen(false), []);

  useLayoutEffect(() => {
    if (!open || !menuRef.current || !triggerRef.current) return;
    positionMenuBelow(menuRef.current, triggerRef.current, { minWidth: 248 });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (menuRef.current?.contains(t) || triggerRef.current?.contains(t)) return;
      close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  const active = STUDY_DEPTH_OPTIONS.find((o) => o.id === value);
  const ActiveIcon = DEPTH_ICONS[value];
  const thinkActive = value === "deep";

  const menu =
    open && mounted ? (
      <div
        ref={menuRef}
        role="listbox"
        id={listId}
        aria-label="Answer depth"
        className="fixed z-[90] rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-[0_12px_40px_rgba(var(--shadow-color)/0.18)] py-1.5 max-h-[min(70vh,320px)] overflow-y-auto"
      >
        <p className="px-3 pt-1 pb-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          Answer depth
        </p>
        {STUDY_DEPTH_OPTIONS.map((opt) => {
          const locked = Boolean(opt.premium) && !isPremium;
          const Icon = DEPTH_ICONS[opt.id];
          const selected = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              role="option"
              aria-selected={selected}
              disabled={locked}
              onClick={() => {
                if (locked) return;
                setStoredStudyDepth(opt.id);
                onChange(opt.id);
                close();
              }}
              className={`w-full flex items-start gap-2.5 px-3 py-2 text-left transition-colors ${
                selected
                  ? "bg-[var(--accent-subtle)]"
                  : "hover:bg-[var(--bg-secondary)]"
              } ${locked ? "opacity-55 cursor-not-allowed" : ""}`}
            >
              <span
                className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${
                  selected
                    ? "border-[var(--accent)] bg-[var(--accent-subtle)] text-[var(--accent)]"
                    : "border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-muted)]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 text-[12px] font-semibold text-[var(--text-primary)]">
                  {opt.id === "deep" ? "Think longer" : opt.label}
                  {locked && <Lock className="w-3 h-3 text-[var(--text-muted)]" />}
                </span>
                <span className="block text-[11px] text-[var(--text-secondary)] leading-snug mt-0.5">
                  {opt.hint}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    ) : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        title={
          active
            ? value === "deep"
              ? "Think longer (Deep) — Premium"
              : `${active.label} answers`
            : "Answer depth"
        }
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={`no-focus-ring shrink-0 rounded-[9px] border flex items-center gap-1.5 transition-colors disabled:opacity-40 ${
          compact ? "h-8 px-1.5" : "h-9 px-2"
        } ${
          thinkActive
            ? "border-[var(--accent)] bg-[var(--accent-subtle)] text-[var(--accent)]"
            : "border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:border-[var(--accent)] hover:bg-[var(--accent-subtle)] hover:text-[var(--accent)]"
        }`}
      >
        <ActiveIcon className="w-4 h-4 shrink-0" />
        <span className="hidden sm:inline text-[11px] font-semibold max-w-[5.5rem] truncate">
          {value === "deep" ? "Think longer" : active?.label ?? "Quick"}
        </span>
      </button>
      {menu ? createPortal(menu, document.body) : null}
    </>
  );
}
