"use client";

import {
  Bold,
  Highlighter,
  Italic,
  Redo2,
  Strikethrough,
  Underline,
  Undo2,
} from "lucide-react";

const FONTS = [
  { id: "default", label: "Default", value: "" },
  { id: "georgia", label: "Georgia", value: "Georgia, serif" },
  { id: "times", label: "Times", value: '"Times New Roman", Times, serif' },
  { id: "arial", label: "Arial", value: "Arial, Helvetica, sans-serif" },
  { id: "mono", label: "Mono", value: '"Courier New", Courier, monospace' },
];

const FONT_SIZES = [
  { label: "12", px: "12px" },
  { label: "14", px: "14px" },
  { label: "16", px: "16px" },
  { label: "18", px: "18px" },
  { label: "24", px: "24px" },
  { label: "32", px: "32px" },
];

const TEXT_COLORS = [
  { id: "default", color: "", label: "Default" },
  { id: "black", color: "#1a1a1a", label: "Black" },
  { id: "red", color: "#dc2626", label: "Red" },
  { id: "blue", color: "#2563eb", label: "Blue" },
  { id: "green", color: "#16a34a", label: "Green" },
];

const HIGHLIGHT_COLORS = [
  { id: "none", color: "", label: "None" },
  { id: "yellow", color: "#fef08a", label: "Yellow" },
  { id: "green", color: "#bbf7d0", label: "Green" },
  { id: "blue", color: "#bfdbfe", label: "Blue" },
];

interface DocToolbarProps {
  onCommand: (cmd: string, value?: string) => void;
}

export function DocToolbar({ onCommand }: DocToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-1 px-3 py-2 border-b border-[var(--border)] bg-[var(--bg-elevated)] shrink-0">
      <button
        type="button"
        className="p-1.5 rounded-md hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
        title="Undo (⌘Z)"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onCommand("undo")}
      >
        <Undo2 className="w-4 h-4" />
      </button>
      <button
        type="button"
        className="p-1.5 rounded-md hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
        title="Redo (⌘⇧Z)"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onCommand("redo")}
      >
        <Redo2 className="w-4 h-4" />
      </button>

      <div className="w-px h-6 bg-[var(--border)] mx-1" />

      <button
        type="button"
        className="p-1.5 rounded-md hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
        title="Bold"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onCommand("bold")}
      >
        <Bold className="w-4 h-4" />
      </button>
      <button
        type="button"
        className="p-1.5 rounded-md hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
        title="Italic"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onCommand("italic")}
      >
        <Italic className="w-4 h-4" />
      </button>
      <button
        type="button"
        className="p-1.5 rounded-md hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
        title="Underline"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onCommand("underline")}
      >
        <Underline className="w-4 h-4" />
      </button>
      <button
        type="button"
        className="p-1.5 rounded-md hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
        title="Strikethrough"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onCommand("strikeThrough")}
      >
        <Strikethrough className="w-4 h-4" />
      </button>

      <div className="w-px h-6 bg-[var(--border)] mx-1" />

      <select
        className="h-7 px-1.5 rounded-md text-[11px] bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)]"
        defaultValue=""
        onChange={(e) => onCommand("fontName", e.target.value)}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {FONTS.map((f) => (
          <option key={f.id} value={f.value}>
            {f.label}
          </option>
        ))}
      </select>

      <select
        className="h-7 px-1.5 rounded-md text-[11px] bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)]"
        defaultValue="16px"
        onChange={(e) => onCommand("fontSizePx", e.target.value)}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {FONT_SIZES.map((s) => (
          <option key={s.px} value={s.px}>
            {s.label}
          </option>
        ))}
      </select>

      <div className="w-px h-6 bg-[var(--border)] mx-1" />

      <button
        type="button"
        className="px-2 py-1 rounded-md text-[11px] hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onCommand("formatBlock", "h1")}
      >
        H1
      </button>
      <button
        type="button"
        className="px-2 py-1 rounded-md text-[11px] hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onCommand("formatBlock", "h2")}
      >
        H2
      </button>
      <button
        type="button"
        className="px-2 py-1 rounded-md text-[11px] hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onCommand("insertUnorderedList")}
      >
        • List
      </button>
      <button
        type="button"
        className="px-2 py-1 rounded-md text-[11px] hover:bg-[var(--bg-secondary)] text-[var(--text-muted)]"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onCommand("insertOrderedList")}
      >
        1. List
      </button>

      <div className="w-px h-6 bg-[var(--border)] mx-1" />

      {TEXT_COLORS.map((c) => (
        <button
          key={c.id}
          type="button"
          className="w-4 h-4 rounded-full border border-black/15"
          style={{ background: c.color || "var(--text-primary)" }}
          title={`Text ${c.label}`}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onCommand("foreColor", c.color || "")}
        />
      ))}

      <span className="flex items-center gap-1 ml-1" title="Highlight">
        <Highlighter className="w-3.5 h-3.5 text-[var(--text-muted)]" />
        {HIGHLIGHT_COLORS.map((c) => (
          <button
            key={c.id}
            type="button"
            className="w-3.5 h-3.5 rounded-sm border border-black/15"
            style={{ background: c.color || "transparent" }}
            title={c.label}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onCommand("hiliteColor", c.color || "transparent")}
          />
        ))}
      </span>
    </div>
  );
}

function applyInlineStyle(style: Partial<CSSStyleDeclaration>) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return false;
  const range = sel.getRangeAt(0);
  const span = document.createElement("span");
  Object.assign(span.style, style);
  try {
    range.surroundContents(span);
  } catch {
    const frag = range.extractContents();
    span.appendChild(frag);
    range.insertNode(span);
  }
  sel.removeAllRanges();
  const next = document.createRange();
  next.selectNodeContents(span);
  sel.addRange(next);
  return true;
}

export function runDocCommand(cmd: string, value?: string) {
  try {
    if (cmd === "undo") {
      document.execCommand("undo");
      return;
    }
    if (cmd === "redo") {
      document.execCommand("redo");
      return;
    }
    if (cmd === "fontSizePx" && value) {
      applyInlineStyle({ fontSize: value });
    } else if (cmd === "fontName" && value) {
      applyInlineStyle({ fontFamily: value });
    } else if (cmd === "hiliteColor") {
      try {
        document.execCommand("hiliteColor", false, value);
      } catch {
        document.execCommand("backColor", false, value);
      }
    } else {
      document.execCommand(cmd, false, value);
    }
  } catch {
    /* ignore */
  }
}
