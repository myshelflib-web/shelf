"use client";

import type { RefObject } from "react";
import { outlineFromBody } from "@/lib/docResearchMarkup";

type Props = {
  bodyRef: RefObject<HTMLElement | null>;
  open: boolean;
  onClose: () => void;
};

export function DocOutlinePanel({ bodyRef, open, onClose }: Props) {
  if (!open) return null;
  const items = bodyRef.current ? outlineFromBody(bodyRef.current) : [];

  return (
    <div className="absolute left-0 top-0 bottom-0 z-20 w-56 border-r border-[var(--border)] bg-[var(--bg-elevated)] flex flex-col shadow-lg">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)]">
        <h3 className="text-xs font-semibold">Outline</h3>
        <button type="button" className="text-xs text-[var(--text-muted)]" onClick={onClose}>
          Close
        </button>
      </div>
      <ul className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className="w-full text-left text-xs text-[var(--text-secondary)] hover:text-[var(--accent)] py-1"
              style={{ paddingLeft: (item.level - 1) * 10 }}
              onClick={() =>
                item.el.scrollIntoView({ behavior: "smooth", block: "start" })
              }
            >
              {item.text || "(empty heading)"}
            </button>
          </li>
        ))}
        {items.length === 0 && (
          <li className="text-[11px] text-[var(--text-muted)]">
            Add H1–H3 headings to build an outline.
          </li>
        )}
      </ul>
    </div>
  );
}
