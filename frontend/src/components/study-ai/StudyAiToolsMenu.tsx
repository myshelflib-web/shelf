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
import { Search, Sparkles } from "lucide-react";
import type { StudyAiCommand, StudyAiCommandScope } from "@/lib/studyAiCommands";
import {
  commandIcon,
  groupedCommands,
} from "@/lib/studyAiCommandGroups";
import { positionMenuBelow } from "@/lib/ui/positionMenuBelow";

export function StudyAiToolsMenu({
  scope,
  disabled,
  onPick,
  onBrowseAll,
  compact,
  iconOnly,
}: {
  scope: StudyAiCommandScope;
  disabled?: boolean;
  onPick: (cmd: StudyAiCommand) => void;
  onBrowseAll: () => void;
  compact?: boolean;
  iconOnly?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const groups = groupedCommands(scope);

  useEffect(() => setMounted(true), []);

  const close = useCallback(() => setOpen(false), []);

  useLayoutEffect(() => {
    if (!open || !menuRef.current || !triggerRef.current) return;
    positionMenuBelow(menuRef.current, triggerRef.current, { minWidth: 280 });
  }, [open, groups.length]);

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

  const menu =
    open && mounted ? (
      <div
        ref={menuRef}
        id={listId}
        role="menu"
        aria-label="Study AI tools"
        className="fixed z-[90] w-[min(100vw-16px,320px)] rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-[0_12px_40px_rgba(var(--shadow-color)/0.18)] overflow-hidden"
      >
        <div className="max-h-[min(60vh,380px)] overflow-y-auto py-1.5">
          {groups.map(({ group, commands }) => (
            <div key={group.id} className="px-1.5 py-0.5">
              <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)] flex items-center gap-1.5">
                <group.icon className="w-3 h-3" />
                {group.label}
              </p>
              {commands.map((cmd) => {
                const Icon = commandIcon(cmd.slash);
                return (
                  <button
                    key={cmd.slash}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      onPick(cmd);
                      close();
                    }}
                    className="w-full flex items-start gap-2.5 rounded-lg px-2 py-2 text-left hover:bg-[var(--bg-secondary)] transition-colors"
                  >
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--accent)]">
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="text-[12px] font-semibold text-[var(--text-primary)]">
                        {cmd.name}
                      </span>
                      <span className="block text-[11px] text-[var(--text-secondary)] leading-snug mt-0.5">
                        {cmd.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            close();
            onBrowseAll();
          }}
          className="w-full flex items-center gap-2 px-3.5 py-2.5 border-t border-[var(--border)] text-[11px] font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--accent)] transition-colors"
        >
          <Search className="w-3.5 h-3.5" />
          Search all commands…
        </button>
      </div>
    ) : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        title="Tools & commands"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={`no-focus-ring shrink-0 flex items-center justify-center transition-colors disabled:opacity-40 ${
          iconOnly
            ? `w-8 h-8 rounded-full ${
                open
                  ? "text-[var(--accent)] bg-[var(--accent-subtle)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
              }`
            : `rounded-[9px] border gap-1.5 ${compact ? "h-8 px-1.5" : "h-9 px-2"} ${
                open
                  ? "border-[var(--accent)] bg-[var(--accent-subtle)] text-[var(--accent)]"
                  : "border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:border-[var(--accent)] hover:bg-[var(--accent-subtle)] hover:text-[var(--accent)]"
              }`
        }`}
      >
        <Sparkles className="w-4 h-4 shrink-0" />
        {!iconOnly && (
          <span className="hidden sm:inline text-[11px] font-semibold">Tools</span>
        )}
      </button>
      {menu ? createPortal(menu, document.body) : null}
    </>
  );
}
