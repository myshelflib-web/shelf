"use client";

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
  return (
    <EditorToolbarShell>
      <ToolGroup>
        <ToolBtn
          label="Type text"
          active={!drawMode}
          onClick={() => onDrawModeChange(false)}
        >
          <Type className="w-[17px] h-[17px]" />
        </ToolBtn>
        <ToolBtn
          label="Draw"
          active={drawMode}
          onClick={() => onDrawModeChange(true)}
        >
          <PenLine className="w-[17px] h-[17px]" />
        </ToolBtn>
      </ToolGroup>

      <ToolSep />

      {!drawMode ? (
        <>
          <ToolGroup>
            <select
              className="select-compact h-[34px] max-w-[7.5rem] rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-xs text-[var(--text-primary)] px-1.5"
              title="Font"
              aria-label="Font family"
              defaultValue=""
              onMouseDown={(e) => e.stopPropagation()}
              onChange={(e) => {
                const v = e.target.value;
                if (!v) onCommand("removeFormat");
                else onCommand("fontName", v);
              }}
            >
              {FONTS.map((f) => (
                <option key={f.id} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
            <select
              className="select-compact h-[34px] w-14 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] text-xs text-[var(--text-primary)] px-1"
              title="Font size"
              aria-label="Font size"
              defaultValue="14px"
              onMouseDown={(e) => e.stopPropagation()}
              onChange={(e) => onCommand("fontSizePx", e.target.value)}
            >
              {FONT_SIZES.map((s) => (
                <option key={s.px} value={s.px}>
                  {s.label}
                </option>
              ))}
            </select>
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
          </ToolGroup>

          <ToolSep />

          <ToolGroup>
            <ToolMuted>A</ToolMuted>
            {TEXT_COLORS.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`w-3.5 h-3.5 rounded-full hover:scale-110 transition-transform border ${
                  c.id === "white" || c.id === "default"
                    ? "border-[var(--border)]"
                    : "border-black/20"
                }`}
                style={{ background: c.color || "var(--text-primary)" }}
                title={c.label}
                aria-label={`Text color ${c.label}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  if (!c.color) onCommand("foreColor", "inherit");
                  else onCommand("foreColor", c.color);
                }}
              />
            ))}
            <Highlighter className="w-3.5 h-3.5 text-[var(--text-muted)] ml-1" />
            {HIGHLIGHT_COLORS.map((c) => (
              <button
                key={c.id}
                type="button"
                className="w-3.5 h-3.5 rounded-sm border border-black/15 hover:scale-110 transition-transform"
                style={{ background: c.color || "transparent" }}
                title={c.label}
                aria-label={`Highlight ${c.label}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() =>
                  onCommand("hiliteColor", c.color || "transparent")
                }
              />
            ))}
          </ToolGroup>
        </>
      ) : (
        <>
          <ToolGroup>
            <ToolBtn
              label="Pen"
              active={drawTool === "pen"}
              onClick={() => onDrawToolChange("pen")}
            >
              <PenLine className="w-[17px] h-[17px]" />
            </ToolBtn>
            <ToolBtn
              label="Stroke eraser"
              active={drawTool === "stroke-erase"}
              onClick={() => onDrawToolChange("stroke-erase")}
            >
              <Eraser className="w-[17px] h-[17px]" />
            </ToolBtn>
            <ToolBtn
              label="Object eraser"
              active={drawTool === "object-erase"}
              onClick={() => onDrawToolChange("object-erase")}
            >
              <MousePointerClick className="w-[17px] h-[17px]" />
            </ToolBtn>
          </ToolGroup>

          {drawTool === "pen" ? (
            <>
              <ToolSep />
              <ToolGroup>
                <ToolMuted>Size</ToolMuted>
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
                {PEN_COLORS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`w-5 h-5 rounded-full border-2 hover:scale-110 transition-transform ${
                      penColor === c.color
                        ? "border-[var(--accent)] scale-110"
                        : c.id === "white"
                          ? "border-[var(--border)]"
                          : "border-transparent"
                    }`}
                    style={{ background: c.color }}
                    title={c.label}
                    aria-pressed={penColor === c.color}
                    onClick={() => onPenColorChange(c.color)}
                  />
                ))}
              </ToolGroup>
            </>
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
