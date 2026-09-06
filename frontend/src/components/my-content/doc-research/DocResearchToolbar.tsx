"use client";

import {
  BookMarked,
  BookOpen,
  Download,
  Footprints,
  FunctionSquare,
  History,
  ListTree,
  MessageSquare,
  Search,
  Sigma,
  Table2,
  Type,
} from "lucide-react";
import { ShelfTooltip } from "@/components/ShelfTooltip";
import { ShelfSelect } from "@/components/ui/ShelfSelect";
import { ToolBtn, ToolGroup, ToolSep } from "../EditorToolbarChrome";
import type { CiteStyle } from "@/lib/researchDocTypes";

type Panel =
  | "sources"
  | "outline"
  | "history"
  | "comments"
  | "find"
  | null;

type Props = {
  compact?: boolean;
  citeStyle: CiteStyle;
  onCiteStyle: (s: CiteStyle) => void;
  suggestMode: boolean;
  onToggleSuggest: () => void;
  panel: Panel;
  onPanel: (p: Panel) => void;
  onFootnote: () => void;
  onFigure: () => void;
  onTable: () => void;
  onEquation: () => void;
  onGlossary: () => void;
  onXref: () => void;
  onExport: (fmt: "md" | "pdf" | "doc" | "tex") => void;
  onResearchAi: (kind: "tighten" | "claims") => void;
};

export function DocResearchToolbar({
  compact = false,
  citeStyle,
  onCiteStyle,
  suggestMode,
  onToggleSuggest,
  panel,
  onPanel,
  onFootnote,
  onFigure,
  onTable,
  onEquation,
  onGlossary,
  onXref,
  onExport,
  onResearchAi,
}: Props) {
  const icon = compact ? "w-3.5 h-3.5" : "w-[17px] h-[17px]";

  return (
    <>
      <ToolSep compact={compact} />
      <ToolGroup>
        <ShelfTooltip text="Sources & citations">
          <ToolBtn
            compact={compact}
            label="Sources"
            hideNativeTitle
            active={panel === "sources"}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onPanel(panel === "sources" ? null : "sources")}
          >
            <BookMarked className={icon} />
          </ToolBtn>
        </ShelfTooltip>
        <ShelfTooltip text="Outline">
          <ToolBtn
            compact={compact}
            label="Outline"
            hideNativeTitle
            active={panel === "outline"}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onPanel(panel === "outline" ? null : "outline")}
          >
            <ListTree className={icon} />
          </ToolBtn>
        </ShelfTooltip>
        <ShelfTooltip text="Find in library">
          <ToolBtn
            compact={compact}
            label="Find in library"
            hideNativeTitle
            active={panel === "find"}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onPanel(panel === "find" ? null : "find")}
          >
            <Search className={icon} />
          </ToolBtn>
        </ShelfTooltip>
        <ShelfSelect
          compact
          className="h-7 max-w-[5.5rem] px-1.5 rounded-md text-[10px] bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)]"
          value={citeStyle}
          options={[
            { value: "apa", label: "APA" },
            { value: "mla", label: "MLA" },
            { value: "chicago", label: "Chicago" },
            { value: "ieee", label: "IEEE" },
          ]}
          aria-label="Citation style"
          onTriggerMouseDown={(e) => e.stopPropagation()}
          onChange={(v) => onCiteStyle(v as CiteStyle)}
        />
      </ToolGroup>
      <ToolSep compact={compact} />
      <ToolGroup>
        <ShelfTooltip text="Insert footnote">
          <ToolBtn
            compact={compact}
            label="Footnote"
            hideNativeTitle
            onMouseDown={(e) => {
              e.preventDefault();
              onFootnote();
            }}
          >
            <Footprints className={icon} />
          </ToolBtn>
        </ShelfTooltip>
        <ShelfTooltip text="Insert figure">
          <ToolBtn
            compact={compact}
            label="Figure"
            hideNativeTitle
            onMouseDown={(e) => {
              e.preventDefault();
              onFigure();
            }}
          >
            <BookOpen className={icon} />
          </ToolBtn>
        </ShelfTooltip>
        <ShelfTooltip text="Insert table">
          <ToolBtn
            compact={compact}
            label="Table"
            hideNativeTitle
            onMouseDown={(e) => {
              e.preventDefault();
              onTable();
            }}
          >
            <Table2 className={icon} />
          </ToolBtn>
        </ShelfTooltip>
        <ShelfTooltip text="Insert equation">
          <ToolBtn
            compact={compact}
            label="Equation"
            hideNativeTitle
            onMouseDown={(e) => {
              e.preventDefault();
              onEquation();
            }}
          >
            <Sigma className={icon} />
          </ToolBtn>
        </ShelfTooltip>
        <ShelfTooltip text="Glossary term">
          <ToolBtn
            compact={compact}
            label="Glossary"
            hideNativeTitle
            onMouseDown={(e) => {
              e.preventDefault();
              onGlossary();
            }}
          >
            <Type className={icon} />
          </ToolBtn>
        </ShelfTooltip>
        <ShelfTooltip text="Cross-reference">
          <ToolBtn
            compact={compact}
            label="Cross-ref"
            hideNativeTitle
            onMouseDown={(e) => {
              e.preventDefault();
              onXref();
            }}
          >
            <BookOpen className={icon} />
          </ToolBtn>
        </ShelfTooltip>
      </ToolGroup>
      <ToolSep compact={compact} />
      <ToolGroup>
        <ShelfTooltip text="History & compare">
          <ToolBtn
            compact={compact}
            label="History"
            hideNativeTitle
            active={panel === "history"}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onPanel(panel === "history" ? null : "history")}
          >
            <History className={icon} />
          </ToolBtn>
        </ShelfTooltip>
        <ShelfTooltip text="Comments">
          <ToolBtn
            compact={compact}
            label="Comments"
            hideNativeTitle
            active={panel === "comments"}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onPanel(panel === "comments" ? null : "comments")}
          >
            <MessageSquare className={icon} />
          </ToolBtn>
        </ShelfTooltip>
        <ShelfTooltip text="Suggest mode (track changes)">
          <ToolBtn
            compact={compact}
            label="Suggest"
            hideNativeTitle
            active={suggestMode}
            onMouseDown={(e) => e.preventDefault()}
            onClick={onToggleSuggest}
          >
            <FunctionSquare className={icon} />
          </ToolBtn>
        </ShelfTooltip>
      </ToolGroup>
      <ToolSep compact={compact} />
      <ToolGroup>
        <ShelfTooltip text="Export Markdown">
          <ToolBtn
            compact={compact}
            label="Export MD"
            hideNativeTitle
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onExport("md")}
          >
            <Download className={icon} />
          </ToolBtn>
        </ShelfTooltip>
        <button
          type="button"
          className="text-[10px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] px-1"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onExport("pdf")}
        >
          PDF
        </button>
        <button
          type="button"
          className="text-[10px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] px-1"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onExport("doc")}
        >
          DOC
        </button>
        <button
          type="button"
          className="text-[10px] font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] px-1"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onExport("tex")}
        >
          LaTeX
        </button>
        <button
          type="button"
          className="text-[10px] font-medium text-[var(--accent)] px-1"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onResearchAi("tighten")}
        >
          Tighten
        </button>
        <button
          type="button"
          className="text-[10px] font-medium text-[var(--accent)] px-1"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => onResearchAi("claims")}
        >
          Claims
        </button>
      </ToolGroup>
    </>
  );
}
