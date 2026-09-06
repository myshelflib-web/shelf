"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Columns3,
  Rows3,
  Trash2,
} from "lucide-react";
import {
  activeCellIndex,
  addTableColumn,
  addTableRow,
  findParentTable,
  removeTableColumn,
  removeTableRow,
} from "@/lib/docTableEdit";

type Props = {
  bodyRef: React.RefObject<HTMLElement | null>;
  onEdited: () => void;
  enabled?: boolean;
};

/** Floating controls when the caret is inside a Doc table. */
export function DocTableControls({
  bodyRef,
  onEdited,
  enabled = true,
}: Props) {
  const [table, setTable] = useState<HTMLTableElement | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const sync = useCallback(() => {
    if (!enabled) {
      setTable(null);
      setPos(null);
      return;
    }
    const body = bodyRef.current;
    const sel = window.getSelection();
    if (!body || !sel || sel.rangeCount === 0) {
      setTable(null);
      setPos(null);
      return;
    }
    if (!body.contains(sel.anchorNode)) {
      setTable(null);
      setPos(null);
      return;
    }
    const t = findParentTable(sel.anchorNode);
    if (!t || !body.contains(t)) {
      setTable(null);
      setPos(null);
      return;
    }
    const r = t.getBoundingClientRect();
    setTable(t);
    setPos({
      top: Math.max(8, r.top - 40),
      left: Math.min(window.innerWidth - 220, Math.max(8, r.left)),
    });
  }, [bodyRef, enabled]);

  useEffect(() => {
    if (!enabled) return;
    const onSel = () => sync();
    document.addEventListener("selectionchange", onSel);
    window.addEventListener("scroll", onSel, true);
    window.addEventListener("resize", onSel);
    return () => {
      document.removeEventListener("selectionchange", onSel);
      window.removeEventListener("scroll", onSel, true);
      window.removeEventListener("resize", onSel);
    };
  }, [enabled, sync]);

  if (!table || !pos) return null;

  const run = (fn: () => void) => {
    fn();
    onEdited();
    sync();
  };

  return (
    <div
      className="fixed z-[80] flex items-center gap-0.5 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-1 shadow-[0_10px_40px_rgba(0,0,0,0.18)]"
      style={{ top: pos.top, left: pos.left }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <Tool
        label="Add row"
        onClick={() =>
          run(() => {
            const { row } = activeCellIndex(table);
            addTableRow(table, row || undefined);
          })
        }
      >
        <Rows3 className="w-3.5 h-3.5" />
        Row
      </Tool>
      <Tool
        label="Add column"
        onClick={() =>
          run(() => {
            const { colIndex } = activeCellIndex(table);
            addTableColumn(table, colIndex >= 0 ? colIndex : undefined);
          })
        }
      >
        <Columns3 className="w-3.5 h-3.5" />
        Col
      </Tool>
      <span className="w-px h-5 bg-[var(--border)] mx-0.5" aria-hidden />
      <Tool
        label="Delete row"
        onClick={() =>
          run(() => {
            const { row } = activeCellIndex(table);
            if (row) removeTableRow(table, row);
          })
        }
      >
        <Trash2 className="w-3.5 h-3.5" />
        Row
      </Tool>
      <Tool
        label="Delete column"
        onClick={() =>
          run(() => {
            const { colIndex } = activeCellIndex(table);
            if (colIndex >= 0) removeTableColumn(table, colIndex);
          })
        }
      >
        <Trash2 className="w-3.5 h-3.5" />
        Col
      </Tool>
    </div>
  );
}

function Tool({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-[11px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
    >
      {children}
    </button>
  );
}
