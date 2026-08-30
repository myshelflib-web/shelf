"use client";

import {
  forwardRef,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";
import { clsx } from "clsx";

/** Centered editor toolbar — design handoff groups + Shelf tokens. */
export function EditorToolbarShell({
  children,
  compact = false,
  phone = false,
  className,
}: {
  children: ReactNode;
  /** Side panels: wrap + left-align instead of a single scrolled row. */
  compact?: boolean;
  /** Phone: one horizontal scroll row, no wrap. */
  phone?: boolean;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "shrink-0 border-b border-[var(--border)] bg-[var(--bg-elevated)]",
        phone && "pdf-toolbar-phone",
        className
      )}
    >
      <div
        className={clsx(
          "editor-toolbar-row flex items-center gap-0.5",
          phone
            ? "flex-nowrap overflow-x-auto scrollbar-none px-1.5 py-1 min-h-[40px]"
            : compact
              ? "flex-wrap justify-start px-1.5 py-1 min-h-0"
              : "justify-center gap-1 px-3 py-1.5 min-h-[56px] overflow-x-auto scrollbar-none"
        )}
      >
        {children}
      </div>
    </div>
  );
}

export function ToolGroup({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("flex items-center gap-1 shrink-0", className)}>
      {children}
    </div>
  );
}

export function ToolSep({ compact = false, phone = false }: { compact?: boolean; phone?: boolean }) {
  return (
    <div
      className={clsx(
        "w-px bg-[var(--border)] shrink-0",
        phone ? "tool-sep-phone" : compact ? "h-5 mx-0.5" : "h-7 mx-1.5"
      )}
      aria-hidden
    />
  );
}

type ToolBtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  label: string;
  compact?: boolean;
  phone?: boolean;
};

export const ToolBtn = forwardRef<HTMLButtonElement, ToolBtnProps>(
  function ToolBtn(
    {
      active,
      label,
      compact = false,
      phone = false,
      className,
      children,
      type = "button",
      ...rest
    },
    ref
  ) {
    return (
      <button
        ref={ref}
        type={type}
        title={label}
        aria-label={label}
        aria-pressed={active}
        className={clsx(
          "inline-flex items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors",
          "hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]",
          "disabled:opacity-35 disabled:pointer-events-none",
          phone
            ? "h-8 min-w-8 px-1 rounded-md tool-btn-phone"
            : compact
              ? "h-7 min-w-7 px-1 rounded-md"
              : "h-[34px] min-w-[34px] px-1.5",
          active &&
            "bg-[var(--accent-light)] text-[var(--accent)] ring-1 ring-[var(--accent)]/25 hover:bg-[var(--accent-light)] hover:text-[var(--accent)]",
          className
        )}
        {...rest}
      >
        {children}
      </button>
    );
  }
);

export function ToolPill({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex h-[34px] min-w-[52px] items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-2 text-[12px] font-medium tabular-nums text-[var(--text-primary)]",
        className
      )}
    >
      {children}
    </span>
  );
}

export function ToolMuted({ children }: { children: ReactNode }) {
  return (
    <span className="text-[11px] text-[var(--text-muted)] shrink-0 px-0.5">
      {children}
    </span>
  );
}

export function ToolChip({
  active,
  label,
  onClick,
  children,
}: {
  active?: boolean;
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={clsx(
        "inline-flex h-[34px] items-center gap-1 rounded-lg px-2 text-[10px] font-semibold",
        active
          ? "bg-[var(--accent)] text-white"
          : "text-[var(--text-muted)] hover:bg-[var(--bg-secondary)]"
      )}
    >
      {children}
    </button>
  );
}
