"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  CheckCircle2,
  Copy,
  Loader2,
  RefreshCw,
  ScanSearch,
  Wand2,
  X,
} from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type {
  OriginalityReport,
  ParaphraseStyle,
  WritingAssistOpen,
} from "@/lib/writingAssistTypes";

type Props = {
  payload: WritingAssistOpen;
  onClose: () => void;
};

const STYLES: { id: ParaphraseStyle; label: string }[] = [
  { id: "paraphrase", label: "Paraphrase" },
  { id: "simplify", label: "Simplify" },
  { id: "formal", label: "Formal" },
  { id: "shorten", label: "Shorten" },
];

export function WritingAssistModal({ payload, onClose }: Props) {
  const [style, setStyle] = useState<ParaphraseStyle>("paraphrase");
  const [variants, setVariants] = useState<string[]>([]);
  const [report, setReport] = useState<OriginalityReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<number | null>(null);
  const [includeAi, setIncludeAi] = useState(
    payload.mode === "originality" ? Boolean(payload.includeAiHeuristic) : true
  );
  const [portalEl, setPortalEl] = useState<HTMLElement | null>(() => {
    if (typeof document === "undefined") return null;
    const fs = document.fullscreenElement;
    return fs instanceof HTMLElement ? fs : document.body;
  });

  useEffect(() => {
    const syncPortal = () => {
      const fs = document.fullscreenElement;
      setPortalEl(fs instanceof HTMLElement ? fs : document.body);
    };
    syncPortal();
    document.addEventListener("fullscreenchange", syncPortal);
    return () => document.removeEventListener("fullscreenchange", syncPortal);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function run(
    nextStyle?: ParaphraseStyle,
    aiOverride?: boolean
  ) {
    const minLen = payload.mode === "paraphrase" ? 12 : 24;
    if (payload.text.trim().length < minLen) {
      setLoading(false);
      setVariants([]);
      setReport(null);
      setError(
        payload.mode === "paraphrase"
          ? "Select or write a bit more text to paraphrase (at least a short sentence)."
          : "Select or write a longer passage to check (about a sentence or more)."
      );
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (payload.mode === "paraphrase") {
        const s = nextStyle ?? style;
        const res = await api.study.paraphrase({
          text: payload.text,
          style: s,
        });
        setVariants(res.variants);
        setStyle(s);
      } else {
        const useAi = aiOverride ?? includeAi;
        const res = await api.study.originality({
          text: payload.text,
          excludePageId: payload.pageId,
          includeAiHeuristic: useAi,
        });
        setReport(res);
      }
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Something went wrong";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const title =
    payload.mode === "paraphrase" ? "Paraphrase" : "Check originality";

  useEffect(() => {
    setVariants([]);
    setReport(null);
    setError(null);
    if (payload.mode === "originality") {
      const ai = Boolean(payload.includeAiHeuristic);
      setIncludeAi(ai);
      void run(undefined, ai);
    } else {
      void run();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run on open
  }, [payload]);

  const modal = (
    <div className="fixed inset-0 z-[210] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-label={title}
        className="relative w-full max-w-lg max-h-[min(88vh,720px)] flex flex-col rounded-[10px] border border-[var(--border)] bg-[var(--bg-elevated)] shadow-2xl"
      >
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-[var(--border)] shrink-0">
          <h2 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
            {payload.mode === "paraphrase" ? (
              <Wand2 className="w-4 h-4 text-[var(--accent)]" />
            ) : (
              <ScanSearch className="w-4 h-4 text-[var(--accent)]" />
            )}
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-[var(--text-secondary)] px-4 pt-3 line-clamp-3 border-l-2 border-[var(--accent)] ml-4 pl-2 shrink-0">
          “{payload.text}”
        </p>

        {payload.mode === "paraphrase" && (
          <div className="flex flex-wrap gap-1.5 px-4 pt-3 shrink-0">
            {STYLES.map((s) => (
              <button
                key={s.id}
                type="button"
                disabled={loading}
                onClick={() => void run(s.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border ${
                  style === s.id
                    ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/10"
                    : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}

        {payload.mode === "originality" && (
          <label className="flex items-center gap-2 px-4 pt-3 text-[11px] text-[var(--text-secondary)] shrink-0">
            <input
              type="checkbox"
              checked={includeAi}
              disabled={loading}
              onChange={(e) => setIncludeAi(e.target.checked)}
              className="rounded border-[var(--border)]"
            />
            Include AI-writing heuristic (uses Study AI tokens)
          </label>
        )}

        <div className="flex-1 overflow-y-auto px-4 py-3 min-h-0 space-y-3">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] py-6 justify-center">
              <Loader2 className="w-4 h-4 animate-spin" />
              Working…
            </div>
          )}
          {error && (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          )}

          {!loading &&
            payload.mode === "paraphrase" &&
            variants.map((v, i) => (
              <div
                key={i}
                className="rounded-[10px] border border-[var(--border)] bg-[var(--bg-secondary)] p-3"
              >
                <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap">
                  {v}
                </p>
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--accent)] hover:opacity-90"
                    onClick={async () => {
                      await navigator.clipboard.writeText(v);
                      setCopied(i);
                      window.setTimeout(() => setCopied(null), 1200);
                    }}
                  >
                    {copied === i ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    Copy
                  </button>
                  {payload.onInsert && (
                    <button
                      type="button"
                      className="text-[11px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      onClick={() => {
                        payload.onInsert?.(v);
                        onClose();
                      }}
                    >
                      Insert
                    </button>
                  )}
                </div>
              </div>
            ))}

          {!loading && report && <OriginalityBody report={report} />}
        </div>

        <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-[var(--border)] shrink-0">
          <button
            type="button"
            disabled={loading}
            onClick={() => void run()}
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            {payload.mode === "originality" ? "Re-check" : "Regenerate"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-[12px] font-medium bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:opacity-90"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );

  if (!portalEl) return null;
  return createPortal(modal, portalEl);
}

function OriginalityBody({ report }: { report: OriginalityReport }) {
  return (
    <div className="space-y-4 text-sm">
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-1.5">
          Library self-check
        </h3>
        <p className="text-xs text-[var(--text-secondary)] mb-2">{report.library.note}</p>
        {report.library.matches.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)]">No close matches.</p>
        ) : (
          <ul className="space-y-2">
            {report.library.matches.map((m) => (
              <li
                key={`${m.pageId}-${m.score}`}
                className="rounded-[10px] border border-[var(--border)] bg-[var(--bg-secondary)] p-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <Link
                    href={m.href}
                    className="text-[13px] font-medium text-[var(--accent)] hover:underline truncate"
                  >
                    {m.title}
                  </Link>
                  <span
                    className={`text-[10px] font-semibold uppercase ${
                      m.severity === "high"
                        ? "text-amber-400"
                        : m.severity === "medium"
                          ? "text-yellow-500/90"
                          : "text-[var(--text-muted)]"
                    }`}
                  >
                    {m.severity} · {Math.round(m.score * 100)}%
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                  {m.notebook}
                  {m.topic ? ` / ${m.topic}` : ""}
                </p>
                <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-3">
                  {m.quote}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-1.5">
          Syllabus / relevancy
        </h3>
        <p className="text-xs text-[var(--text-secondary)] mb-2">
          {report.syllabus.note}
        </p>
        {report.syllabus.overlaps.length > 0 && (
          <ul className="space-y-2">
            {report.syllabus.overlaps.map((o) => (
              <li
                key={o.docId}
                className="rounded-[10px] border border-[var(--border)] bg-[var(--bg-secondary)] p-2.5"
              >
                <p className="text-[13px] font-medium text-[var(--text-primary)]">
                  {o.title}{" "}
                  <span className="text-[10px] text-[var(--text-muted)]">
                    · {Math.round(o.score * 100)}%
                  </span>
                </p>
                <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-3">
                  {o.excerpt}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-1.5">
          Web originality
        </h3>
        <p className="text-xs text-[var(--text-secondary)]">{report.web.message}</p>
        {report.web.upgradeUrl && (
          <Link
            href={report.web.upgradeUrl}
            className="inline-block mt-1.5 text-[12px] font-medium text-[var(--accent)] hover:underline"
          >
            View plan
          </Link>
        )}
      </section>

      {report.aiHeuristic && (
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-1.5">
            AI-writing heuristic
          </h3>
          <p className="text-[13px] text-[var(--text-primary)]">
            {report.aiHeuristic.likelihood} · score {report.aiHeuristic.score}
          </p>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            {report.aiHeuristic.summary}
          </p>
          {report.aiHeuristic.signals.length > 0 && (
            <ul className="mt-1.5 list-disc pl-4 text-xs text-[var(--text-secondary)]">
              {report.aiHeuristic.signals.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          )}
          <p className="text-[10px] text-[var(--text-muted)] mt-2">
            {report.aiHeuristic.disclaimer}
          </p>
        </section>
      )}
    </div>
  );
}
