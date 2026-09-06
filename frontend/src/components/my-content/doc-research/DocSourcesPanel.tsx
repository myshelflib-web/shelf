"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { CitationSource, CiteStyle } from "@/lib/researchDocTypes";
import {
  buildBibliographyShell,
  buildCiteSpan,
  insertHtmlAtSelection,
} from "@/lib/docResearchMarkup";

type Props = {
  pageId: string;
  open: boolean;
  onClose: () => void;
  onInserted: () => void;
  citeStyle: CiteStyle;
};

export function DocSourcesPanel({
  pageId,
  open,
  onClose,
  onInserted,
  citeStyle,
}: Props) {
  const [q, setQ] = useState("");
  const [sources, setSources] = useState<CitationSource[]>([]);
  const [libraryHits, setLibraryHits] = useState<
    Array<{ id: string; title: string; quote?: string }>
  >([]);
  const [importText, setImportText] = useState("");
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    void api.myContent
      .listCitations(q || undefined)
      .then((r) => setSources(r.sources))
      .catch(() => setSources([]));
    if (q.trim().length >= 2) {
      void api.study
        .libraryAsk({ query: q.trim() })
        .then((r) =>
          setLibraryHits(
            (r.citations || []).slice(0, 8).map((c) => ({
              id: c.pageId,
              title: c.title,
              quote: c.quote,
            }))
          )
        )
        .catch(() => setLibraryHits([]));
    } else {
      setLibraryHits([]);
    }
  }, [open, q]);

  if (!open) return null;

  async function citeFromLibrary(hit: {
    id: string;
    title: string;
    quote?: string;
  }) {
    setBusy(true);
    setError(null);
    try {
      const { source } = await api.myContent.createCitation({
        title: hit.title,
        type: "document",
        pageId: hit.id,
      });
      const formatted = await api.myContent.formatCitations({
        style: citeStyle,
        cites: [{ sourceId: source.id }],
      });
      const quote = (hit.quote || "").trim();
      const block = quote
        ? `<blockquote><p>${quote.replace(/</g, "&lt;")}</p></blockquote>`
        : "";
      insertHtmlAtSelection(
        `${block}${buildCiteSpan({
          sourceId: source.id,
          label: formatted.inText || `(${source.title})`,
          key: source.bibtexKey || undefined,
        })}`
      );
      await api.myContent.linkPageSource(pageId, source.id).catch(() => null);
      setSources((s) => [source, ...s]);
      onInserted();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Cite from library failed");
    } finally {
      setBusy(false);
    }
  }

  async function insertCite(source: CitationSource) {
    setBusy(true);
    setError(null);
    try {
      const formatted = await api.myContent.formatCitations({
        style: citeStyle,
        cites: [{ sourceId: source.id }],
      });
      insertHtmlAtSelection(
        buildCiteSpan({
          sourceId: source.id,
          label: formatted.inText || `(${source.title})`,
          key: source.bibtexKey || undefined,
        })
      );
      await api.myContent.linkPageSource(pageId, source.id).catch(() => null);
      onInserted();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Cite failed");
    } finally {
      setBusy(false);
    }
  }

  async function addManual() {
    if (!title.trim()) return;
    setBusy(true);
    try {
      const { source } = await api.myContent.createCitation({
        title: title.trim(),
      });
      setTitle("");
      setSources((s) => [source, ...s]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Create failed");
    } finally {
      setBusy(false);
    }
  }

  async function runImport() {
    if (!importText.trim()) return;
    setBusy(true);
    try {
      const format = importText.trim().startsWith("[") || importText.trim().startsWith("{")
        ? "csl-json"
        : "bibtex";
      const { sources: created } = await api.myContent.importCitations({
        text: importText,
        format,
      });
      setImportText("");
      setSources((s) => [...created, ...s]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setBusy(false);
    }
  }

  function insertBib() {
    insertHtmlAtSelection(buildBibliographyShell(citeStyle));
    onInserted();
  }

  async function refreshBib() {
    const body = document.querySelector(".shelf-doc-body") as HTMLElement | null;
    if (!body) return;
    const cites = [...body.querySelectorAll(".shelf-cite")].map((n) => ({
      sourceId: n.getAttribute("data-source-id") || "",
      locator: n.getAttribute("data-locator") || undefined,
    })).filter((c) => c.sourceId);
    if (cites.length === 0) {
      insertBib();
      return;
    }
    setBusy(true);
    try {
      const formatted = await api.myContent.formatCitations({
        style: citeStyle,
        cites,
      });
      let bib = body.querySelector(".shelf-bibliography") as HTMLElement | null;
      if (!bib) {
        insertHtmlAtSelection(buildBibliographyShell(citeStyle));
        bib = body.querySelector(".shelf-bibliography");
      }
      if (bib) {
        bib.setAttribute("data-style", citeStyle);
        const entries = bib.querySelector(".shelf-bib-entries") || bib;
        entries.innerHTML = formatted.bibliography
          .split("\n")
          .filter(Boolean)
          .map((line) => {
            const safe = line
              .replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;");
            return `<p class="csl-entry">${safe}</p>`;
          })
          .join("");
      }
      onInserted();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bibliography failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="absolute right-0 top-0 bottom-0 z-20 w-72 border-l border-[var(--border)] bg-[var(--bg-elevated)] flex flex-col shadow-lg">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)]">
        <h3 className="text-xs font-semibold text-[var(--text-primary)]">
          Sources
        </h3>
        <button
          type="button"
          className="text-xs text-[var(--text-muted)]"
          onClick={onClose}
        >
          Close
        </button>
      </div>
      <div className="p-2 space-y-2 border-b border-[var(--border)]">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search sources…"
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-2 py-1.5 text-xs"
        />
        <div className="flex gap-1">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="New source title"
            className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-2 py-1.5 text-xs"
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => void addManual()}
            className="px-2 text-[11px] font-medium text-[var(--accent)]"
          >
            Add
          </button>
        </div>
        <textarea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          rows={3}
          placeholder="Paste BibTeX or CSL-JSON…"
          className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-2 py-1.5 text-[11px]"
        />
        <div className="flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void runImport()}
            className="text-[11px] font-medium text-[var(--accent)]"
          >
            Import
          </button>
          <button
            type="button"
            onClick={insertBib}
            className="text-[11px] font-medium text-[var(--text-secondary)]"
          >
            Insert bibliography
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void refreshBib()}
            className="text-[11px] font-medium text-[var(--accent)]"
          >
            Refresh bibliography
          </button>
        </div>
        {error && <p className="text-[11px] text-red-400">{error}</p>}
      </div>
      <ul className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {libraryHits.length > 0 && (
          <li className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)] px-1 pt-1">
            From library
          </li>
        )}
        {libraryHits.map((h) => (
          <li key={`lib-${h.id}`}>
            <button
              type="button"
              disabled={busy}
              onClick={() => void citeFromLibrary(h)}
              className="w-full text-left rounded-lg border border-dashed border-[var(--border)] bg-[var(--bg-secondary)] px-2 py-1.5 hover:border-[var(--accent)]"
            >
              <p className="text-xs font-medium text-[var(--text-primary)] line-clamp-2">
                {h.title}
              </p>
              {h.quote && (
                <p className="text-[10px] text-[var(--text-muted)] line-clamp-2 mt-0.5">
                  {h.quote}
                </p>
              )}
            </button>
          </li>
        ))}
        {sources.length > 0 && libraryHits.length > 0 && (
          <li className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)] px-1 pt-2">
            Your sources
          </li>
        )}
        {sources.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              disabled={busy}
              onClick={() => void insertCite(s)}
              className="w-full text-left rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-2 py-1.5 hover:border-[var(--accent)]"
            >
              <p className="text-xs font-medium text-[var(--text-primary)] line-clamp-2">
                {s.title}
              </p>
              <p className="text-[10px] text-[var(--text-muted)]">
                {s.year || "n.d."}
                {s.bibtexKey ? ` · ${s.bibtexKey}` : ""}
              </p>
            </button>
          </li>
        ))}
        {sources.length === 0 && libraryHits.length === 0 && (
          <li className="text-[11px] text-[var(--text-muted)] px-1">
            No sources yet. Add, import BibTeX, or search the library.
          </li>
        )}
      </ul>
    </div>
  );
}
