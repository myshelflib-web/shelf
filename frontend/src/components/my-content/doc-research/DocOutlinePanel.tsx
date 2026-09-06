"use client";

import type { RefObject } from "react";
import { outlineFromBody } from "@/lib/docResearchMarkup";
import { DocResearchSidePanel } from "./DocResearchSidePanel";

type Props = {
  bodyRef: RefObject<HTMLElement | null>;
  open: boolean;
  onClose: () => void;
};

export function DocOutlinePanel({ bodyRef, open, onClose }: Props) {
  const items = open && bodyRef.current ? outlineFromBody(bodyRef.current) : [];

  return (
    <DocResearchSidePanel
      open={open}
      title="Outline"
      onClose={onClose}
      side="left"
      widthClass="w-60"
    >
      <ul className="p-2.5 space-y-0.5">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className="w-full text-left rounded-lg px-2 py-1.5 text-[12px] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--accent)]"
              style={{ paddingLeft: 8 + (item.level - 1) * 12 }}
              onClick={() =>
                item.el.scrollIntoView({ behavior: "smooth", block: "start" })
              }
            >
              {item.text || "(empty heading)"}
            </button>
          </li>
        ))}
        {items.length === 0 && (
          <li className="text-[12px] text-[var(--text-muted)] px-2 py-3">
            Add H1–H3 headings to build an outline.
          </li>
        )}
      </ul>
    </DocResearchSidePanel>
  );
}
