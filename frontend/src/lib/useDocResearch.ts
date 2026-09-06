"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import {
  buildEquationSpan,
  buildFigureHtml,
  buildFootnoteSup,
  buildGlossaryTerm,
  buildTableHtml,
  buildXref,
  countDocStats,
  insertHtmlAtSelection,
  renumberFootnotes,
} from "@/lib/docResearchMarkup";
import {
  downloadDocLatex,
  downloadDocMarkdown,
  downloadDocPdf,
  downloadDocWord,
} from "@/lib/docExport";
import { renderMathHtml } from "@/lib/studyAiMath";
import type { CiteStyle } from "@/lib/researchDocTypes";
import {
  CITE_IN_DOC_EVENT,
  type CiteInDocDetail,
  consumePendingCite,
} from "@/lib/citeInOpenDoc";

const CITE_STYLE_KEY = "shelf-doc-cite-style";

export type ResearchPanel =
  | "sources"
  | "outline"
  | "history"
  | "comments"
  | "find"
  | null;

function loadCiteStyle(): CiteStyle {
  if (typeof window === "undefined") return "apa";
  const v = localStorage.getItem(CITE_STYLE_KEY);
  if (v === "apa" || v === "mla" || v === "chicago" || v === "ieee") return v;
  return "apa";
}

type Args = {
  pageId?: string;
  bodyRef: React.RefObject<HTMLElement | null>;
  emit: () => void;
  title?: string;
};

export function useDocResearch({ pageId, bodyRef, emit, title = "Document" }: Args) {
  const [panel, setPanel] = useState<ResearchPanel>(null);
  const [citeStyle, setCiteStyleState] = useState<CiteStyle>("apa");
  const [suggestMode, setSuggestMode] = useState(false);
  const [stats, setStats] = useState({ words: 0, chars: 0, readingMinutes: 0 });
  const [selectionQuote, setSelectionQuote] = useState<string | undefined>();
  const lastRevHash = useRef("");
  const revTimer = useRef<number | null>(null);

  useEffect(() => {
    setCiteStyleState(loadCiteStyle());
  }, []);

  const setCiteStyle = useCallback((s: CiteStyle) => {
    setCiteStyleState(s);
    localStorage.setItem(CITE_STYLE_KEY, s);
  }, []);

  const refreshStats = useCallback(() => {
    const el = bodyRef.current;
    if (!el) return;
    setStats(countDocStats(el));
  }, [bodyRef]);

  const paintEquations = useCallback(() => {
    const el = bodyRef.current;
    if (!el) return;
    el.querySelectorAll("span.shelf-eq").forEach((node) => {
      const span = node as HTMLElement;
      const latex = span.getAttribute("data-latex") || "";
      if (!latex) return;
      try {
        span.innerHTML = renderMathHtml(latex, false);
      } catch {
        span.textContent = latex;
      }
    });
  }, [bodyRef]);

  const afterEdit = useCallback(() => {
    const el = bodyRef.current;
    if (el) renumberFootnotes(el);
    paintEquations();
    refreshStats();
    emit();
  }, [bodyRef, emit, paintEquations, refreshStats]);

  useEffect(() => {
    paintEquations();
    refreshStats();
  }, [paintEquations, refreshStats]);

  const scheduleRevision = useCallback(
    (html: string) => {
      if (!pageId || !html) return;
      const hash = `${html.length}:${html.slice(0, 64)}:${html.slice(-64)}`;
      if (hash === lastRevHash.current) return;
      if (revTimer.current) window.clearTimeout(revTimer.current);
      revTimer.current = window.setTimeout(() => {
        lastRevHash.current = hash;
        void api.myContent.createRevision(pageId, html).catch(() => null);
      }, 2500);
    },
    [pageId]
  );

  const insertFootnote = useCallback(() => {
    const note = window.prompt("Footnote text:") || "";
    if (!note.trim()) return;
    const id = `fn-${Math.random().toString(36).slice(2, 8)}`;
    const n =
      (bodyRef.current?.querySelectorAll("sup.shelf-footnote").length || 0) + 1;
    bodyRef.current?.focus();
    insertHtmlAtSelection(buildFootnoteSup(id, n, note.trim()));
    afterEdit();
  }, [afterEdit, bodyRef]);

  const insertFigure = useCallback(() => {
    const caption = window.prompt("Figure caption:") || "Caption";
    bodyRef.current?.focus();
    insertHtmlAtSelection(buildFigureHtml(caption));
    afterEdit();
  }, [afterEdit, bodyRef]);

  const insertTable = useCallback(() => {
    const caption = window.prompt("Table caption:") || "Caption";
    bodyRef.current?.focus();
    insertHtmlAtSelection(buildTableHtml(caption));
    afterEdit();
  }, [afterEdit, bodyRef]);

  const insertEquation = useCallback(() => {
    const latex = window.prompt("LaTeX equation:", "E = mc^2");
    if (latex == null) return;
    bodyRef.current?.focus();
    insertHtmlAtSelection(buildEquationSpan(latex.trim() || "E = mc^2"));
    afterEdit();
  }, [afterEdit, bodyRef]);

  const insertGlossary = useCallback(() => {
    const term = window.prompt("Term:") || "";
    const def = window.prompt("Definition:") || "";
    if (!term.trim()) return;
    bodyRef.current?.focus();
    insertHtmlAtSelection(buildGlossaryTerm(term.trim(), def.trim()));
    afterEdit();
  }, [afterEdit, bodyRef]);

  const insertXref = useCallback(() => {
    const targetId = window.prompt("Target element id (e.g. fig-1, sec-1):") || "";
    if (!targetId.trim()) return;
    const label = window.prompt("Label text:", `Section ${targetId}`) || targetId;
    bodyRef.current?.focus();
    insertHtmlAtSelection(buildXref(targetId.trim(), label.trim()));
    afterEdit();
  }, [afterEdit, bodyRef]);

  const onExport = useCallback(
    async (fmt: "md" | "pdf" | "doc" | "tex") => {
      const html = bodyRef.current?.innerHTML || "";
      if (fmt === "md") downloadDocMarkdown(title, html);
      else if (fmt === "pdf") await downloadDocPdf(title, html);
      else if (fmt === "doc") downloadDocWord(title, html);
      else downloadDocLatex(title, html);
    },
    [bodyRef, title]
  );

  const onResearchAi = useCallback(
    async (kind: "tighten" | "claims") => {
      const el = bodyRef.current;
      const text =
        (window.getSelection()?.toString() || el?.innerText || "")
          .replace(/\s+/g, " ")
          .trim();
      if (text.length < 20) {
        window.alert("Select or write more text for research assist.");
        return;
      }
      const keys = [
        ...new Set(
          [...(el?.querySelectorAll(".shelf-cite") || [])].map(
            (n) =>
              n.getAttribute("data-bibtex-key") ||
              n.getAttribute("data-source-id") ||
              ""
          )
        ),
      ].filter(Boolean);
      try {
        const result = await api.study.researchAssist({
          text,
          kind: kind === "tighten" ? "tighten_abstract" : "check_claims",
          maxWords: 150,
          bibKeys: keys,
        });
        if (kind === "tighten") {
          bodyRef.current?.focus();
          const sel = window.getSelection();
          if (
            sel &&
            !sel.isCollapsed &&
            bodyRef.current?.contains(sel.anchorNode)
          ) {
            document.execCommand("insertText", false, result.text);
          } else {
            insertHtmlAtSelection(
              `<p>${result.text
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")}</p>`
            );
          }
          afterEdit();
        } else {
          window.alert(result.text);
        }
      } catch (e) {
        window.alert(e instanceof Error ? e.message : "Research assist failed");
      }
    },
    [afterEdit, bodyRef]
  );

  const acceptSuggest = useCallback(() => {
    const el = bodyRef.current;
    if (!el) return;
    el.querySelectorAll("mark.shelf-suggest").forEach((m) => {
      const op = m.getAttribute("data-op");
      if (op === "del") m.remove();
      else {
        const parent = m.parentNode;
        while (m.firstChild) parent?.insertBefore(m.firstChild, m);
        m.remove();
      }
    });
    afterEdit();
  }, [afterEdit, bodyRef]);

  const rejectSuggest = useCallback(() => {
    const el = bodyRef.current;
    if (!el) return;
    el.querySelectorAll("mark.shelf-suggest").forEach((m) => {
      const op = m.getAttribute("data-op");
      if (op === "ins") m.remove();
      else {
        const parent = m.parentNode;
        while (m.firstChild) parent?.insertBefore(m.firstChild, m);
        m.remove();
      }
    });
    afterEdit();
  }, [afterEdit, bodyRef]);

  const wrapSuggestOnInput = useCallback(() => {
    if (!suggestMode) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !sel.isCollapsed) return;
    // Best-effort: mark last typed character path is hard; wrap selection if any.
  }, [suggestMode]);

  const applySuggestToSelection = useCallback(
    (op: "ins" | "del") => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
      const range = sel.getRangeAt(0);
      const mark = document.createElement("mark");
      mark.className = "shelf-suggest";
      mark.setAttribute("data-op", op);
      mark.setAttribute("data-author", "me");
      try {
        range.surroundContents(mark);
      } catch {
        const frag = range.extractContents();
        mark.appendChild(frag);
        range.insertNode(mark);
      }
      afterEdit();
    },
    [afterEdit]
  );

  const insertCitePayload = useCallback(
    async (detail: CiteInDocDetail) => {
      const el = bodyRef.current;
      if (!el) return;
      el.focus();
      const quote = detail.quote.trim();
      let citeHtml = "";
      if (pageId && (detail.pageTitle || detail.sourcePageId)) {
        try {
          const { source } = await api.myContent.createCitation({
            title: detail.pageTitle || "Source",
            type: "document",
            url: detail.href,
            pages: detail.pageNumber ? String(detail.pageNumber) : undefined,
          });
          const formatted = await api.myContent.formatCitations({
            style: citeStyle,
            cites: [
              {
                sourceId: source.id,
                locator: detail.pageNumber
                  ? String(detail.pageNumber)
                  : undefined,
              },
            ],
          });
          const { buildCiteSpan } = await import("@/lib/docResearchMarkup");
          citeHtml = buildCiteSpan({
            sourceId: source.id,
            label: formatted.inText || `(${source.title})`,
            locator: detail.pageNumber
              ? String(detail.pageNumber)
              : undefined,
            key: source.bibtexKey || undefined,
          });
          await api.myContent.linkPageSource(pageId, source.id).catch(() => null);
        } catch {
          citeHtml = "";
        }
      }
      const block = `<blockquote><p>${quote
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")}</p>${
        detail.pageTitle
          ? `<footer>${detail.pageTitle.replace(/</g, "&lt;")}</footer>`
          : ""
      }</blockquote>${citeHtml}`;
      insertHtmlAtSelection(block);
      afterEdit();
      setPanel("sources");
    },
    [afterEdit, bodyRef, citeStyle, pageId]
  );

  useEffect(() => {
    const onCite = (e: Event) => {
      const detail = (e as CustomEvent<CiteInDocDetail>).detail;
      if (!detail?.quote) return;
      void insertCitePayload(detail);
    };
    window.addEventListener(CITE_IN_DOC_EVENT, onCite);
    const pending = consumePendingCite();
    if (pending?.quote) void insertCitePayload(pending);
    return () => window.removeEventListener(CITE_IN_DOC_EVENT, onCite);
  }, [insertCitePayload]);

  const captureSelectionQuote = useCallback(() => {
    const t = window.getSelection()?.toString().trim();
    setSelectionQuote(t || undefined);
  }, []);

  return {
    panel,
    setPanel,
    citeStyle,
    setCiteStyle,
    suggestMode,
    setSuggestMode,
    stats,
    selectionQuote,
    refreshStats,
    afterEdit,
    scheduleRevision,
    insertFootnote,
    insertFigure,
    insertTable,
    insertEquation,
    insertGlossary,
    insertXref,
    onExport,
    onResearchAi,
    acceptSuggest,
    rejectSuggest,
    applySuggestToSelection,
    wrapSuggestOnInput,
    captureSelectionQuote,
  };
}
