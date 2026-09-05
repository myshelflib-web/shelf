"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

export function ToolPopover({
  open,
  onClose,
  anchorEl,
  title,
  children,
  widthClass = "w-[220px]",
}: {
  open: boolean;
  onClose: () => void;
  anchorEl: HTMLElement | null;
  title: string;
  children: ReactNode;
  widthClass?: string;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useLayoutEffect(() => {
    if (!open || !anchorEl) {
      setPos(null);
      return;
    }
    const place = () => {
      const r = anchorEl.getBoundingClientRect();
      const panelW = panelRef.current?.offsetWidth ?? 220;
      const panelH = panelRef.current?.offsetHeight ?? 160;
      const left = Math.min(
        Math.max(8, r.left + r.width / 2 - panelW / 2),
        window.innerWidth - panelW - 8
      );
      const below = r.bottom + 8;
      const top =
        below + panelH > window.innerHeight - 8
          ? Math.max(8, r.top - panelH - 8)
          : below;
      setPos({ top, left });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, anchorEl]);

  useEffect(() => {
    if (!open) return;
    // Arm after the opening click's pointerup so the popover does not
    // instantly close (looks like the tool "does nothing").
    let armed = false;
    const armTimer = window.setTimeout(() => {
      armed = true;
    }, 100);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    // pointerup (not pointerdown): closing on pointerdown cancels an
    // in-progress text selection in the article.
    const onUp = (e: Event) => {
      if (!armed) return;
      const target = e.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (anchorEl?.contains(target)) return;
      // Keep open while the user is selecting article text (incl. page padding).
      const sel = window.getSelection();
      if (sel && !sel.isCollapsed && sel.toString().trim().length >= 1) {
        return;
      }
      if (
        target instanceof Element &&
        target.closest(
          "[data-shelf-doc-surface], .personal-content, .prose-content, .highlight-menu"
        )
      ) {
        return;
      }
      onCloseRef.current();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerup", onUp, true);
    return () => {
      window.clearTimeout(armTimer);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerup", onUp, true);
    };
  }, [open, anchorEl]);

  if (!open || !anchorEl) return null;

  return (
    <div
      ref={panelRef}
      role="group"
      aria-label={title}
      className={`fixed z-[91] ${widthClass} rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-3.5 shadow-[0_10px_40px_rgba(0,0,0,0.18)]`}
      style={pos ? { top: pos.top, left: pos.left } : { visibility: "hidden" }}
    >
      <p className="text-[12px] font-semibold text-[var(--text-primary)] mb-2.5">
        {title}
      </p>
      {children}
    </div>
  );
}

export function ColorSwatch({
  color,
  label,
  selected,
  onClick,
}: {
  color: string;
  label: string;
  selected?: boolean;
  onClick: () => void;
}) {
  const fill = color || "var(--text-primary)";
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={selected}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="w-6 h-6 rounded-[5px] shrink-0"
      style={{
        background: fill,
        boxShadow: selected
          ? `0 0 0 1.5px var(--bg-elevated), 0 0 0 3px ${fill}`
          : "inset 0 0 0 1px rgba(0,0,0,0.14)",
      }}
    />
  );
}

export function ColorSwatchGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-6 gap-2">{children}</div>;
}
