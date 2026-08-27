"use client";

import { useState } from "react";
import {
  AlignLeft,
  Bold,
  Highlighter,
  Italic,
  Redo2,
  Strikethrough,
  Underline,
  Undo2,
} from "lucide-react";
import {
  EditorToolbarShell,
  ToolBtn,
  ToolGroup,
  ToolSep,
} from "./EditorToolbarChrome";
import { ShelfSelect } from "@/components/ui/ShelfSelect";

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
  const [fontValue, setFontValue] = useState("");
  const [fontSize, setFontSize] = useState("16px");

  return (
    <EditorToolbarShell>
      <ToolGroup>
        <ToolBtn
          label="Undo (⌘Z)"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onCommand("undo")}
        >
          <Undo2 className="w-[17px] h-[17px]" />
        </ToolBtn>
        <ToolBtn
          label="Redo (⌘⇧Z)"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onCommand("redo")}
        >
          <Redo2 className="w-[17px] h-[17px]" />
        </ToolBtn>
      </ToolGroup>

      <ToolSep />

      <ToolGroup>
        <ToolBtn
          label="Bold"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onCommand("bold")}
        >
          <Bold className="w-[17px] h-[17px]" />
        </ToolBtn>
        <ToolBtn
          label="Italic"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onCommand("italic")}
        >
          <Italic className="w-[17px] h-[17px]" />
        </ToolBtn>
        <ToolBtn
          label="Underline"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onCommand("underline")}
        >
          <Underline className="w-[17px] h-[17px]" />
        </ToolBtn>
        <ToolBtn
          label="Strikethrough"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onCommand("strikeThrough")}
        >
          <Strikethrough className="w-[17px] h-[17px]" />
        </ToolBtn>
        <ToolBtn
          label="Align left"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onCommand("justifyLeft")}
        >
          <AlignLeft className="w-[17px] h-[17px]" />
        </ToolBtn>
      </ToolGroup>

      <ToolSep />

      <ToolGroup>
        <ShelfSelect
          compact
          className="h-[34px] px-2 rounded-lg text-[11px] bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)]"
          value={fontValue}
          options={FONTS.map((f) => ({ value: f.value, label: f.label }))}
          aria-label="Font"
          onTriggerMouseDown={(e) => e.stopPropagation()}
          onChange={(v) => {
            setFontValue(v);
            onCommand("fontName", v);
          }}
        />
        <ShelfSelect
          compact
          className="h-[34px] px-2 rounded-lg text-[11px] bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)]"
          value={fontSize}
          options={FONT_SIZES.map((s) => ({ value: s.px, label: s.label }))}
          aria-label="Font size"
          onTriggerMouseDown={(e) => e.stopPropagation()}
          onChange={(v) => {
            setFontSize(v);
            onCommand("fontSizePx", v);
          }}
        />
      </ToolGroup>

      <ToolSep />

      <ToolGroup>
        <ToolBtn
          label="Heading 1"
          className="!min-w-[34px] px-2 text-[11px] font-semibold"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onCommand("formatBlock", "h1")}
        >
          H1
        </ToolBtn>
        <ToolBtn
          label="Heading 2"
          className="!min-w-[34px] px-2 text-[11px] font-semibold"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onCommand("formatBlock", "h2")}
        >
          H2
        </ToolBtn>
        <ToolBtn
          label="Bullet list"
          className="!min-w-[34px] px-2 text-[11px] font-semibold"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onCommand("insertUnorderedList")}
        >
          • List
        </ToolBtn>
        <ToolBtn
          label="Numbered list"
          className="!min-w-[34px] px-2 text-[11px] font-semibold"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onCommand("insertOrderedList")}
        >
          1.
        </ToolBtn>
      </ToolGroup>

      <ToolSep />

      <ToolGroup>
        {TEXT_COLORS.map((c) => (
          <button
            key={c.id}
            type="button"
            className="w-5 h-5 rounded-full border border-black/15"
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
      </ToolGroup>
    </EditorToolbarShell>
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
