"use client";

import { useRef, useState } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  PenLine,
  Type,
  Highlighter,
  Eraser,
  MousePointerClick,
  Palette,
  ALargeSmall,
} from "lucide-react";
import { CANVAS_BACKGROUNDS } from "@/lib/blankCanvas";
import {
  EditorToolbarShell,
  ToolBtn,
  ToolChip,
  ToolGroup,
  ToolMuted,
  ToolSep,
} from "./EditorToolbarChrome";
import { ShelfSelect } from "@/components/ui/ShelfSelect";
import { ColorSwatch, ColorSwatchGrid, ToolPopover } from "./ToolPopover";

export type DrawTool = "pen" | "stroke-erase" | "object-erase";

const FONTS = [
  { id: "default", label: "Default", value: "" },
  { id: "georgia", label: "Georgia", value: "Georgia, serif" },
  { id: "times", label: "Times", value: '"Times New Roman", Times, serif' },
  { id: "arial", label: "Arial", value: "Arial, Helvetica, sans-serif" },
  { id: "verdana", label: "Verdana", value: "Verdana, Geneva, sans-serif" },
  { id: "mono", label: "Mono", value: '"Courier New", Courier, monospace' },
];

const FONT_SIZES = [
  { label: "10", px: "10px" },
  { label: "11", px: "11px" },
  { label: "12", px: "12px" },
  { label: "14", px: "14px" },
  { label: "16", px: "16px" },
  { label: "18", px: "18px" },
  { label: "24", px: "24px" },
  { label: "32", px: "32px" },
];

const TEXT_COLORS = [
  { id: "default", color: "", label: "Default" },
  { id: "white", color: "#ffffff", label: "White" },
  { id: "black", color: "#1a1a1a", label: "Black" },
  { id: "red", color: "#dc2626", label: "Red" },
  { id: "orange", color: "#ea580c", label: "Orange" },
  { id: "amber", color: "#d97706", label: "Amber" },
  { id: "green", color: "#16a34a", label: "Green" },
  { id: "blue", color: "#2563eb", label: "Blue" },
  { id: "violet", color: "#7c3aed", label: "Violet" },
];

const HIGHLIGHT_COLORS = [
  { id: "none", color: "", label: "None" },
  { id: "yellow", color: "#fef08a", label: "Yellow" },
  { id: "green", color: "#bbf7d0", label: "Green" },
  { id: "blue", color: "#bfdbfe", label: "Blue" },
  { id: "pink", color: "#fbcfe8", label: "Pink" },
  { id: "orange", color: "#fed7aa", label: "Orange" },
];

export const PEN_COLORS = [
  { id: "black", color: "#1f2937", label: "Black" },
  { id: "white", color: "#ffffff", label: "White" },
  { id: "red", color: "#dc2626", label: "Red" },
  { id: "blue", color: "#2563eb", label: "Blue" },
  { id: "green", color: "#16a34a", label: "Green" },
  { id: "amber", color: "#d97706", label: "Amber" },
  { id: "violet", color: "#7c3aed", label: "Violet" },
  { id: "pink", color: "#db2777", label: "Pink" },
];

export const PEN_SIZES = [
  { id: "xs", size: 1.5, label: "XS" },
  { id: "s", size: 2.5, label: "S" },
  { id: "m", size: 4, label: "M" },
  { id: "l", size: 7, label: "L" },
  { id: "xl", size: 12, label: "XL" },
];

export const DEFAULT_PEN_COLOR =
  PEN_COLORS.find((c) => c.id === "white")?.color ?? "#ffffff";
export const DEFAULT_PEN_SIZE =
  PEN_SIZES.find((s) => s.id === "m")?.size ?? 4;

interface BlankEditorToolbarProps {
  drawMode: boolean;
  onDrawModeChange: (v: boolean) => void;
  drawTool: DrawTool;
  onDrawToolChange: (tool: DrawTool) => void;
  onCommand: (cmd: string, value?: string) => void;
  penColor: string;
  penSize: number;
  onPenColorChange: (c: string) => void;
  onPenSizeChange: (s: number) => void;
  canvasBg: string;
  onCanvasBgChange: (c: string) => void;
}

export function BlankEditorToolbar({
  drawMode,
  onDrawModeChange,
  drawTool,
  onDrawToolChange,
  onCommand,
  penColor,
  penSize,
  onPenColorChange,
  onPenSizeChange,
  canvasBg,
  onCanvasBgChange,
}: BlankEditorToolbarProps) {
  const [fontValue, setFontValue] = useState("");
  const [fontSize, setFontSize] = useState("14px");
  const [sizeOpen, setSizeOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const [highlightOpen, setHighlightOpen] = useState(false);
  const [penOpen, setPenOpen] = useState(false);
  const sizeBtnRef = useRef<HTMLButtonElement>(null);
  const colorBtnRef = useRef<HTMLButtonElement>(null);
  const highlightBtnRef = useRef<HTMLButtonElement>(null);
  const penBtnRef = useRef<HTMLButtonElement>(null);

  return (
    <EditorToolbarShell>
      <ToolGroup>
        <ToolBtn
          label="Type text"
          active={!drawMode}
          onClick={() => {
            setPenOpen(false);
            onDrawModeChange(false);
          }}
        >
          <Type className="w-[17px] h-[17px]" />
        </ToolBtn>
        <ToolBtn
          label="Draw"
          active={drawMode}
          onClick={() => {
            setSizeOpen(false);
            setColorOpen(false);
            setHighlightOpen(false);
            onDrawModeChange(true);
          }}
        >
          <PenLine className="w-[17px] h-[17px]" />
        </ToolBtn>
      </ToolGroup>

      <ToolSep />

      {!drawMode ? (
        <>
          <ToolGroup>
            <ShelfSelect
              compact
              className="h-[34px] max-w-[7.5rem] rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-xs text-[var(--text-primary)] px-1.5"
              value={fontValue}
              options={FONTS.map((f) => ({ value: f.value, label: f.label }))}
              aria-label="Font family"
              onTriggerMouseDown={(e) => e.stopPropagation()}
              onChange={(v) => {
                setFontValue(v);
                if (!v) onCommand("removeFormat");
                else onCommand("fontName", v);
              }}
            />
            <ToolBtn
              ref={sizeBtnRef}
              label="Text size"
              active={sizeOpen}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setColorOpen(false);
                setHighlightOpen(false);
                setSizeOpen((v) => !v);
              }}
            >
              <ALargeSmall className="w-[17px] h-[17px]" />
            </ToolBtn>
          </ToolGroup>

          <ToolPopover
            open={sizeOpen}
            onClose={() => setSizeOpen(false)}
            anchorEl={sizeBtnRef.current}
            title="Text size"
          >
            <div className="grid grid-cols-4 gap-1.5">
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
          </ToolGroup>

          <ToolSep />

          <ToolGroup>
            <ToolBtn
              ref={colorBtnRef}
              label="Pen / text color"
              active={colorOpen}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setSizeOpen(false);
                setHighlightOpen(false);
                setColorOpen((v) => !v);
              }}
            >
              <Palette className="w-[17px] h-[17px]" />
            </ToolBtn>
            <ToolBtn
              ref={highlightBtnRef}
              label="Highlighter"
              active={highlightOpen}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setSizeOpen(false);
                setColorOpen(false);
                setHighlightOpen((v) => !v);
              }}
            >
              <Highlighter className="w-[17px] h-[17px]" />
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
                  label={c.label}
                  onClick={() => {
                    if (!c.color) onCommand("foreColor", "inherit");
                    else onCommand("foreColor", c.color);
                  }}
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
                  onClick={() =>
                    onCommand("hiliteColor", c.color || "transparent")
                  }
                />
              ))}
            </ColorSwatchGrid>
          </ToolPopover>
        </>
      ) : (
        <>
          <ToolGroup>
            <ToolBtn
              ref={penBtnRef}
              label="Pen"
              active={drawTool === "pen"}
              onClick={() => {
                onDrawToolChange("pen");
                setPenOpen((v) => (drawTool === "pen" ? !v : true));
              }}
            >
              <PenLine className="w-[17px] h-[17px]" />
            </ToolBtn>
            <ToolBtn
              label="Stroke eraser"
              active={drawTool === "stroke-erase"}
              onClick={() => {
                setPenOpen(false);
                onDrawToolChange("stroke-erase");
              }}
            >
              <Eraser className="w-[17px] h-[17px]" />
            </ToolBtn>
            <ToolBtn
              label="Object eraser"
              active={drawTool === "object-erase"}
              onClick={() => {
                setPenOpen(false);
                onDrawToolChange("object-erase");
              }}
            >
              <MousePointerClick className="w-[17px] h-[17px]" />
            </ToolBtn>
          </ToolGroup>

          {drawTool === "pen" ? (
            <ToolPopover
              open={penOpen}
              onClose={() => setPenOpen(false)}
              anchorEl={penBtnRef.current}
              title="Pen / text color"
            >
              <div className="flex items-center gap-1 mb-3">
                {PEN_SIZES.map((s) => (
                  <ToolChip
                    key={s.id}
                    label={`Pen ${s.label}`}
                    active={Math.abs(penSize - s.size) < 0.01}
                    onClick={() => onPenSizeChange(s.size)}
                  >
                    {s.label}
                  </ToolChip>
                ))}
              </div>
              <ColorSwatchGrid>
                {PEN_COLORS.map((c) => (
                  <ColorSwatch
                    key={c.id}
                    color={c.color}
                    label={c.label}
                    selected={penColor === c.color}
                    onClick={() => onPenColorChange(c.color)}
                  />
                ))}
              </ColorSwatchGrid>
            </ToolPopover>
          ) : null}

          <ToolSep />

          <ToolGroup>
            <ToolMuted>Bg</ToolMuted>
            {CANVAS_BACKGROUNDS.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`w-5 h-5 rounded-md border-2 hover:scale-110 transition-transform ${
                  canvasBg === c.color
                    ? "border-[var(--accent)] scale-110"
                    : c.id === "white" || c.id === "paper" || c.id === "mist"
                      ? "border-[var(--border)]"
                      : "border-transparent"
                }`}
                style={{ background: c.color }}
                title={`Background ${c.label}`}
                aria-pressed={canvasBg === c.color}
                onClick={() => onCanvasBgChange(c.color)}
              />
            ))}
          </ToolGroup>
        </>
      )}
    </EditorToolbarShell>
  );
}
