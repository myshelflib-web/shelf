"use client";

import { useRef, useState, type ReactNode } from "react";
import {
  BookMarked,
  BookOpen,
  Download,
  Footprints,
  FunctionSquare,
  History,
  ListTree,
  MessageSquare,
  Plus,
  Search,
  Sigma,
  Sparkles,
  Table2,
  Type,
  Upload,
} from "lucide-react";
import { ShelfTooltip } from "@/components/ShelfTooltip";
import { ShelfSelect } from "@/components/ui/ShelfSelect";
import { ToolBtn, ToolGroup, ToolSep } from "../EditorToolbarChrome";
import { ToolPopover } from "../ToolPopover";
import type { CiteStyle } from "@/lib/researchDocTypes";

type Panel =
  | "sources"
  | "outline"
  | "history"
  | "comments"
  | "find"
  | null;

type Menu = "insert" | "export" | "ai" | "import" | null;

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
  onImportFile: (file: File) => void | Promise<void>;
  importBusy?: boolean;
};

function MenuRow({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[12px] font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
    >
      {children}
      <span>{label}</span>
    </button>
  );
}

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
  onImportFile,
  importBusy = false,
}: Props) {
  const icon = compact ? "w-3.5 h-3.5" : "w-[17px] h-[17px]";
  const [menu, setMenu] = useState<Menu>(null);
  const insertRef = useRef<HTMLButtonElement>(null);
  const exportRef = useRef<HTMLButtonElement>(null);
  const aiRef = useRef<HTMLButtonElement>(null);
  const importRef = useRef<HTMLButtonElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const openMenu = (next: Menu) => {
    setMenu((cur) => (cur === next ? null : next));
  };

  const close = () => setMenu(null);

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
        <ShelfTooltip text="Insert">
          <ToolBtn
            ref={insertRef}
            compact={compact}
            label="Insert"
            hideNativeTitle
            active={menu === "insert"}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => openMenu("insert")}
          >
            <Plus className={icon} />
          </ToolBtn>
        </ShelfTooltip>
      </ToolGroup>
      <ToolPopover
        open={menu === "insert"}
        onClose={close}
        anchorEl={insertRef.current}
        title="Insert"
        widthClass="w-[200px]"
      >
        <div className="flex flex-col gap-1">
          <MenuRow
            label="Footnote"
            onClick={() => {
              close();
              onFootnote();
            }}
          >
            <Footprints className="w-3.5 h-3.5" />
          </MenuRow>
          <MenuRow
            label="Figure"
            onClick={() => {
              close();
              onFigure();
            }}
          >
            <BookOpen className="w-3.5 h-3.5" />
          </MenuRow>
          <MenuRow
            label="Table"
            onClick={() => {
              close();
              onTable();
            }}
          >
            <Table2 className="w-3.5 h-3.5" />
          </MenuRow>
          <MenuRow
            label="Equation"
            onClick={() => {
              close();
              onEquation();
            }}
          >
            <Sigma className="w-3.5 h-3.5" />
          </MenuRow>
          <MenuRow
            label="Glossary"
            onClick={() => {
              close();
              onGlossary();
            }}
          >
            <Type className="w-3.5 h-3.5" />
          </MenuRow>
          <MenuRow
            label="Cross-ref"
            onClick={() => {
              close();
              onXref();
            }}
          >
            <BookOpen className="w-3.5 h-3.5" />
          </MenuRow>
        </div>
      </ToolPopover>

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
        <ShelfTooltip text="Import paper or document">
          <ToolBtn
            ref={importRef}
            compact={compact}
            label="Import"
            hideNativeTitle
            active={menu === "import"}
            disabled={importBusy}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => openMenu("import")}
          >
            <Upload className={icon} />
          </ToolBtn>
        </ShelfTooltip>
        <ShelfTooltip text="Export">
          <ToolBtn
            ref={exportRef}
            compact={compact}
            label="Export"
            hideNativeTitle
            active={menu === "export"}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => openMenu("export")}
          >
            <Download className={icon} />
          </ToolBtn>
        </ShelfTooltip>
        <ShelfTooltip text="Research assist">
          <ToolBtn
            ref={aiRef}
            compact={compact}
            label="Research assist"
            hideNativeTitle
            active={menu === "ai"}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => openMenu("ai")}
          >
            <Sparkles className={icon} />
          </ToolBtn>
        </ShelfTooltip>
      </ToolGroup>

      <ToolPopover
        open={menu === "import"}
        onClose={close}
        anchorEl={importRef.current}
        title="Import into Doc"
        widthClass="w-[240px]"
      >
        <p className="text-[11px] text-[var(--text-muted)] mb-2.5 leading-snug">
          PDF, TXT, MD, or DOCX — text is converted and inserted at the cursor.
        </p>
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          accept=".pdf,.txt,.md,.markdown,.docx,application/pdf,text/plain,text/markdown,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            close();
            void onImportFile(file);
          }}
        />
        <MenuRow
          label={importBusy ? "Importing…" : "Choose file"}
          onClick={() => {
            if (importBusy) return;
            fileRef.current?.click();
          }}
        >
          <Upload className="w-3.5 h-3.5" />
        </MenuRow>
      </ToolPopover>

      <ToolPopover
        open={menu === "export"}
        onClose={close}
        anchorEl={exportRef.current}
        title="Export"
        widthClass="w-[200px]"
      >
        <div className="flex flex-col gap-1">
          <MenuRow
            label="Markdown"
            onClick={() => {
              close();
              onExport("md");
            }}
          >
            <Download className="w-3.5 h-3.5" />
          </MenuRow>
          <MenuRow
            label="PDF"
            onClick={() => {
              close();
              onExport("pdf");
            }}
          >
            <Download className="w-3.5 h-3.5" />
          </MenuRow>
          <MenuRow
            label="Word (.doc)"
            onClick={() => {
              close();
              onExport("doc");
            }}
          >
            <Download className="w-3.5 h-3.5" />
          </MenuRow>
          <MenuRow
            label="LaTeX"
            onClick={() => {
              close();
              onExport("tex");
            }}
          >
            <Download className="w-3.5 h-3.5" />
          </MenuRow>
        </div>
      </ToolPopover>

      <ToolPopover
        open={menu === "ai"}
        onClose={close}
        anchorEl={aiRef.current}
        title="Research assist"
        widthClass="w-[220px]"
      >
        <div className="flex flex-col gap-1">
          <MenuRow
            label="Tighten abstract"
            onClick={() => {
              close();
              onResearchAi("tighten");
            }}
          >
            <Sparkles className="w-3.5 h-3.5" />
          </MenuRow>
          <MenuRow
            label="Check claims"
            onClick={() => {
              close();
              onResearchAi("claims");
            }}
          >
            <Sparkles className="w-3.5 h-3.5" />
          </MenuRow>
        </div>
      </ToolPopover>
    </>
  );
}
