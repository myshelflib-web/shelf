"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, ExternalLink, Loader2 } from "lucide-react";
import { ClipPasteLayer } from "./ClipPasteLayer";
import { captureCurrentTab, cropElementFromTabCapture } from "@/lib/captureTab";
import { api } from "@/lib/api";
import { linkEmbedBlockedMessage } from "@/lib/linkEmbedPolicy";

interface EmbedViewerProps {
  pageId: string;
  title: string;
  url: string;
  /** When set (e.g. preloaded Learn), skip library embed-status API. */
  embeddableHint?: boolean | null;
  linkStatus?: string | null;
  /** Live embed probe when embeddableHint is null (Learn / current affairs). */
  embedStatusProbe?: () => Promise<{ embeddable: boolean | null; linkStatus?: string | null }>;
  editing?: boolean;
  draftTitle?: string;
  draftUrl?: string;
  onDraftTitleChange?: (value: string) => void;
  onDraftUrlChange?: (value: string) => void;
  clipMode?: boolean;
  onClip?: (imageDataUrl: string) => void;
  onImport?: () => Promise<void>;
}

export function EmbedViewer({
  pageId,
  title,
  url,
  embeddableHint,
  linkStatus,
  embedStatusProbe,
  editing = false,
  draftTitle = "",
  draftUrl = "",
  onDraftTitleChange,
  onDraftUrlChange,
  clipMode = false,
  onClip,
  onImport,
}: EmbedViewerProps) {
  const isPdf = /\.pdf($|\?)/i.test(url);
  const rootRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const autoImportTried = useRef(false);
  const importingRef = useRef(false);
  const [capturing, setCapturing] = useState(false);
  const [captureError, setCaptureError] = useState("");
  const [showPaste, setShowPaste] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importNotice, setImportNotice] = useState("");
  const [embeddable, setEmbeddable] = useState<boolean | null>(null);

  const handleImport = useCallback(async () => {
    if (!onImport || importingRef.current) return;
    importingRef.current = true;
    setImportNotice("");
    setImporting(true);
    try {
      await onImport();
    } catch (err) {
      setImportNotice(
        err instanceof Error
          ? err.message
          : "Couldn’t import — open the link instead."
      );
    } finally {
      importingRef.current = false;
      setImporting(false);
    }
  }, [onImport]);

  useEffect(() => {
    let cancelled = false;
    autoImportTried.current = false;
    setEmbeddable(null);
    setImportNotice("");

    if (!url) {
      setEmbeddable(false);
      return;
    }

    if (embeddableHint === true || embeddableHint === false) {
      setEmbeddable(embeddableHint);
      return;
    }

    if (!pageId) {
      if (embedStatusProbe) {
        embedStatusProbe()
          .then((r) => {
            if (!cancelled) setEmbeddable(r.embeddable === true);
          })
          .catch(() => {
            if (!cancelled) setEmbeddable(false);
          });
        return () => {
          cancelled = true;
        };
      }
      setEmbeddable(false);
      return;
    }

    api.myContent
      .embedStatus(pageId)
      .then((r) => {
        if (!cancelled) setEmbeddable(r.embeddable);
      })
      .catch(() => {
        if (!cancelled) setEmbeddable(false);
      });

    return () => {
      cancelled = true;
    };
  }, [pageId, url, embeddableHint, embedStatusProbe]);

  // Sites that block iframes: try Import once so the user isn’t stuck on “refused to connect”.
  useEffect(() => {
    if (embeddable !== false || !onImport || autoImportTried.current) return;
    autoImportTried.current = true;
    void handleImport();
  }, [embeddable, onImport, handleImport]);

  const captureIframe = async () => {
    if (!onClip) return;
    setCaptureError("");
    setCapturing(true);
    try {
      const tab = await captureCurrentTab();
      const target = wrapRef.current ?? frameRef.current;
      if (!target) throw new Error("Nothing to capture.");
      const data = cropElementFromTabCapture(tab, target);
      if (!data) throw new Error("Could not crop the page.");
      onClip(data);
    } catch (err) {
      const name = err && typeof err === "object" && "name" in err ? String(err.name) : "";
      if (name === "NotAllowedError") {
        setCaptureError("Tab capture was cancelled. Choose this tab when asked, or paste a screenshot.");
      } else {
        setCaptureError(
          err instanceof Error ? err.message : "Could not capture this page."
        );
      }
    } finally {
      setCapturing(false);
    }
  };

  if (editing) {
    return (
      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="max-w-xl mx-auto space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">
            Linked pages stay as embeds when the site allows it. Import to Shelf
            when you need highlights, or paste a passage in Study AI.
          </p>
          <label className="block text-xs text-[var(--text-secondary)]">
            Title
            <input
              value={draftTitle}
              onChange={(e) => onDraftTitleChange?.(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)]"
            />
          </label>
          <label className="block text-xs text-[var(--text-secondary)]">
            Link
            <input
              type="url"
              value={draftUrl}
              onChange={(e) => onDraftUrlChange?.(e.target.value)}
              placeholder="https://…"
              className="mt-1 w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)]"
            />
          </label>
        </div>
      </div>
    );
  }

  if (!url) {
    return (
      <div className="flex-1 flex items-center justify-center px-8 text-sm text-[var(--text-secondary)]">
        No link yet. Use Edit to add a URL.
      </div>
    );
  }

  const showFrame = embeddable === true;
  const showBlockedPanel = embeddable === false;
  const checking = embeddable === null;

  return (
    <div
      ref={rootRef}
      className="flex-1 flex flex-col min-h-0 bg-[var(--bg-secondary)] [:fullscreen]:bg-[var(--bg-primary)]"
    >
      <div className="flex items-center justify-between gap-3 px-4 py-2 border-b border-[var(--border)] bg-[var(--bg-primary)] shrink-0">
        <p className="text-xs text-[var(--text-secondary)] truncate min-w-0">
          {isPdf ? "Linked PDF" : "Linked page"} · {url}
        </p>
        <div className="flex items-center gap-1 shrink-0">
          {onImport && (
            <button
              type="button"
              className="inline-flex items-center gap-1 text-xs text-[var(--accent)] hover:underline px-2 py-1 disabled:opacity-50"
              disabled={importing}
              onClick={() => void handleImport()}
              title="Save a Shelf copy when the page is publicly readable"
            >
              {importing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              {importing ? "Importing…" : "Import to Shelf"}
            </button>
          )}
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-[var(--accent)] hover:underline px-2 py-1"
            title="Open linked page in a new browser tab"
            onClick={(e) => {
              e.preventDefault();
              window.open(url, "_blank", "noopener,noreferrer");
            }}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open
          </a>
        </div>
      </div>

      <div ref={wrapRef} className="flex-1 min-h-0 relative">
        {clipMode && onClip && showFrame && (
          <div className="absolute inset-x-0 top-0 z-20 flex flex-col items-center gap-2 p-3 pointer-events-none">
            <div className="pointer-events-auto max-w-md text-center rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 shadow-lg">
              <p className="text-sm text-[var(--text-secondary)] mb-2">
                The browser blocks reading an iframe directly. Share this tab
                to clip what’s on screen, or paste a screenshot.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  className="chip-btn"
                  disabled={capturing}
                  onClick={() => void captureIframe()}
                >
                  {capturing ? "Capturing…" : "Capture this tab"}
                </button>
                <button
                  type="button"
                  className="chip-btn"
                  onClick={() => setShowPaste(true)}
                >
                  Paste image
                </button>
              </div>
              {captureError && (
                <p className="text-xs text-red-400 mt-2">{captureError}</p>
              )}
            </div>
          </div>
        )}
        {clipMode && onClip && showPaste && (
          <ClipPasteLayer
            hint="Paste a screenshot (⌘V), drop an image, or choose a file."
            onClip={onClip}
          />
        )}

        {checking && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[var(--bg-primary)] px-6">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]" />
            <p className="text-sm text-[var(--text-secondary)]">Checking link…</p>
          </div>
        )}

        {showBlockedPanel && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[var(--bg-primary)] px-6 text-center">
            {importing ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]" />
                <div className="max-w-md space-y-1">
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    Saving a Shelf copy…
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    This site blocks embedding, so Shelf is importing the page
                    instead.
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="max-w-md space-y-2">
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    This site won’t load inside Shelf
                  </p>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    {importNotice ||
                      linkEmbedBlockedMessage(linkStatus)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {onImport && (
                    <button
                      type="button"
                      className="chip-btn"
                      disabled={importing}
                      onClick={() => void handleImport()}
                    >
                      <Download className="w-3.5 h-3.5" />
                      Import to Shelf
                    </button>
                  )}
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="chip-btn"
                    onClick={(e) => {
                      e.preventDefault();
                      window.open(url, "_blank", "noopener,noreferrer");
                    }}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open in browser
                  </a>
                </div>
              </>
            )}
          </div>
        )}

        {showFrame && (
          <iframe
            ref={frameRef}
            title={title}
            src={url}
            className="absolute inset-0 w-full h-full border-0 bg-white"
            sandbox={
              isPdf
                ? undefined
                : "allow-scripts allow-popups allow-forms allow-popups-to-escape-sandbox"
            }
            referrerPolicy="no-referrer-when-downgrade"
          />
        )}
      </div>

      {showFrame && (
        <p className="px-4 py-2 text-[11px] text-[var(--text-muted)] shrink-0">
          Highlights and sending selected text are not available in embeds. Use
          Study AI to ask about the page, or paste a passage there. Import to
          Shelf when you need a highlightable copy.
        </p>
      )}
    </div>
  );
}
