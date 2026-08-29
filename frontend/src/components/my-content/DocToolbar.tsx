"use client";

import { useRef, useState } from "react";
import {
  AlignLeft,
  Bold,
  Highlighter,
  Italic,
  Palette,
  Redo2,
  Strikethrough,
  Type,
  Underline,
  Undo2,
} from "lucide-react";
import {
  EditorToolbarShell,
  ToolBtn,
  ToolChip,
  ToolGroup,
  ToolSep,
} from "./EditorToolbarChrome";
import { ShelfSelect } from "@/components/ui/ShelfSelect";
import { ColorSwatch, ColorSwatchGrid, ToolPopover } from "./ToolPopover";

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
  /** Narrow side panels — wrap + smaller controls. */
  compact?: boolean;
}

export function DocToolbar({ onCommand, compact = false }: DocToolbarProps) {
  const [fontValue, setFontValue] = useState("");
  const [fontSize, setFontSize] = useState("16px");
  const [sizeOpen, setSizeOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const [highlightOpen, setHighlightOpen] = useState(false);
  const sizeBtnRef = useRef<HTMLButtonElement>(null);
  const colorBtnRef = useRef<HTMLButtonElement>(null);
  const highlightBtnRef = useRef<HTMLButtonElement>(null);
  const icon = compact ? "w-3.5 h-3.5" : "w-[17px] h-[17px]";
  const labelBtn = compact
    ? "!min-w-7 px-1.5 text-[10px] font-semibold"
    : "!min-w-[34px] px-2 text-[11px] font-semibold";

  return (
    <EditorToolbarShell compact={compact}>
      <ToolGroup>
        <ToolBtn
          compact={compact}
          label="Undo (⌘Z)"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onCommand("undo")}
        >
          <Undo2 className={icon} />
        </ToolBtn>
        <ToolBtn
          compact={compact}
          label="Redo (⌘⇧Z)"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onCommand("redo")}
        >
          <Redo2 className={icon} />
        </ToolBtn>
      </ToolGroup>

      <ToolSep compact={compact} />

      <ToolGroup>
        <ToolBtn
          compact={compact}
          label="Bold"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onCommand("bold")}
        >
          <Bold className={icon} />
        </ToolBtn>
        <ToolBtn
          compact={compact}
          label="Italic"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onCommand("italic")}
        >
          <Italic className={icon} />
        </ToolBtn>
        <ToolBtn
          compact={compact}
          label="Underline"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onCommand("underline")}
        >
          <Underline className={icon} />
        </ToolBtn>
        <ToolBtn
          compact={compact}
          label="Strikethrough"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onCommand("strikeThrough")}
        >
          <Strikethrough className={icon} />
        </ToolBtn>
        <ToolBtn
          compact={compact}
          label="Align left"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onCommand("justifyLeft")}
        >
          <AlignLeft className={icon} />
        </ToolBtn>
      </ToolGroup>

      <ToolSep compact={compact} />

      <ToolGroup>
        <ShelfSelect
          compact
          className={
            compact
              ? "h-7 max-w-[5.5rem] px-1.5 rounded-md text-[10px] bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)]"
              : "h-[34px] px-2 rounded-lg text-[11px] bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)]"
          }
          value={fontValue}
          options={FONTS.map((f) => ({ value: f.value, label: f.label }))}
          aria-label="Font"
          onTriggerMouseDown={(e) => e.stopPropagation()}
          onChange={(v) => {
            setFontValue(v);
            onCommand("fontName", v);
          }}
        />
        <ToolBtn
          ref={sizeBtnRef}
          compact={compact}
          label="Text size"
          active={sizeOpen}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            setColorOpen(false);
            setHighlightOpen(false);
            setSizeOpen((v) => !v);
          }}
        >
          <Type className={icon} />
        </ToolBtn>
      </ToolGroup>

      <ToolPopover
        open={sizeOpen}
        onClose={() => setSizeOpen(false)}
        anchorEl={sizeBtnRef.current}
        title="Text size"
      >
        <div className="grid grid-cols-3 gap-1.5">
          {FONT_SIZES.map((s) => (
            <ToolChip
              key={s.px}
              label={`${s.label}px`}
              active={fontSize === s.px}
              onClick={() => {
                setFontSize(s.px);
                onCommand("fontSizePx", s.px);
              }}
            >
              {s.label}
            </ToolChip>
          ))}
        </div>
      </ToolPopover>

      <ToolSep compact={compact} />

      <ToolGroup>
        <ToolBtn
          compact={compact}
          label="Heading 1"
          className={labelBtn}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onCommand("formatBlock", "h1")}
        >
          H1
        </ToolBtn>
        <ToolBtn
          compact={compact}
          label="Heading 2"
          className={labelBtn}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onCommand("formatBlock", "h2")}
        >
          H2
        </ToolBtn>
        <ToolBtn
          compact={compact}
          label="Bullet list"
          className={labelBtn}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onCommand("insertUnorderedList")}
        >
          {compact ? "•" : "• List"}
        </ToolBtn>
        <ToolBtn
          compact={compact}
          label="Numbered list"
          className={labelBtn}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onCommand("insertOrderedList")}
        >
          1.
        </ToolBtn>
      </ToolGroup>

      <ToolSep compact={compact} />

      <ToolGroup>
        <ToolBtn
          ref={colorBtnRef}
          compact={compact}
          label="Pen / text color"
          active={colorOpen}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            setSizeOpen(false);
            setHighlightOpen(false);
            setColorOpen((v) => !v);
          }}
        >
          <Palette className={icon} />
        </ToolBtn>
        <ToolBtn
          ref={highlightBtnRef}
          compact={compact}
          label="Highlighter"
          active={highlightOpen}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            setSizeOpen(false);
            setColorOpen(false);
            setHighlightOpen((v) => !v);
          }}
        >
          <Highlighter className={icon} />
        </ToolBtn>
      </ToolGroup>

      <ToolPopover
        open={colorOpen}
        onClose={() => setColorOpen(false)}
        anchorEl={colorBtnRef.current}
        title="Pen / text color"
      >
        <ColorSwatchGrid>
          {TEXT_COLORS.map((c) => (
            <ColorSwatch
              key={c.id}
              color={c.color || "#e8e8ea"}
              label={`Text ${c.label}`}
              onClick={() => onCommand("foreColor", c.color || "")}
            />
          ))}
        </ColorSwatchGrid>
      </ToolPopover>

      <ToolPopover
        open={highlightOpen}
        onClose={() => setHighlightOpen(false)}
        anchorEl={highlightBtnRef.current}
        title="Highlighter"
      >
        <ColorSwatchGrid>
          {HIGHLIGHT_COLORS.map((c) => (
            <ColorSwatch
              key={c.id}
              color={c.color || "#ffffff"}
              label={c.label}
              onClick={() => onCommand("hiliteColor", c.color || "transparent")}
            />
          ))}
        </ColorSwatchGrid>
      </ToolPopover>
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
