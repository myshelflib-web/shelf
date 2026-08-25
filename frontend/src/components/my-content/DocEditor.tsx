"use client";

import { useCallback, useEffect, useRef } from "react";
import { parseDocBody, serializeDocBody } from "@/lib/docEditor";
import { DocToolbar, runDocCommand } from "./DocToolbar";

interface DocEditorProps {
  initialHtml: string;
  onChange: (html: string) => void;
  onViewStateChange?: (state: { scrollTop: number; scrollLeft: number }) => void;
}

export function DocEditor({
  initialHtml,
  onChange,
  onViewStateChange,
}: DocEditorProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const seeded = useRef(false);

  const emit = useCallback(() => {
    const el = bodyRef.current;
    if (!el) return;
    onChangeRef.current(serializeDocBody(el.innerHTML));
  }, []);

  // Seed once on mount — never rewrite innerHTML from props (caret would reset).
  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;
    const el = bodyRef.current;
    if (el) {
      el.innerHTML = parseDocBody(initialHtml);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed once
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t?.closest?.("input, textarea, select")) return;
      // Only handle undo when the caret is in this doc (or nowhere / this surface).
      if (
        t &&
        t !== bodyRef.current &&
        !bodyRef.current?.contains(t) &&
        t.isContentEditable
      ) {
        return;
      }
      if (e.key === "z" || e.key === "Z") {
        e.preventDefault();
        bodyRef.current?.focus();
        runDocCommand(e.shiftKey ? "redo" : "undo");
        emit();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [emit]);

  const runCommand = (cmd: string, value?: string) => {
    bodyRef.current?.focus();
    runDocCommand(cmd, value);
    emit();
  };

  return (
    <div className="relative flex-1 flex flex-col overflow-hidden bg-[var(--bg-primary)]">
      <DocToolbar onCommand={runCommand} />
      <div
        ref={viewportRef}
        className="flex-1 overflow-auto doc-editor-viewport"
        onScroll={() => {
          const vp = viewportRef.current;
          if (!vp) return;
          onViewStateChange?.({
            scrollTop: vp.scrollTop,
            scrollLeft: vp.scrollLeft,
          });
        }}
      >
        <div className="max-w-3xl mx-auto px-8 py-8 min-h-full">
          <div className="shelf-doc-editor rounded-[10px] border border-[var(--border)] bg-[var(--bg-elevated)] shadow-sm min-h-[70vh]">
            <div
              ref={bodyRef}
              className="shelf-doc-body prose-content px-10 py-12 outline-none min-h-[70vh] text-[var(--text-primary)]"
              contentEditable
              suppressContentEditableWarning
              onInput={emit}
              onBlur={emit}
            />
          </div>
        </div>
      </div>
      <p className="shrink-0 text-center text-[11px] text-[var(--text-muted)] py-1.5 border-t border-[var(--border)]">
        Doc — type and format your notes · changes autosave
      </p>
    </div>
  );
}
