"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, FileText, FolderPlus, X } from "lucide-react";
import { api } from "@/lib/api";
import { CircleLoader } from "@/components/CircleLoader";
import { ShelfSelect } from "@/components/ui/ShelfSelect";
import {
  downloadAnswer,
  markdownToExportHtml,
  type DownloadFormat,
} from "@/lib/exportAnswer";
import type { UserSubject, UserTopicGroup } from "@/types";

type SaveMode = "choose" | "download" | "library" | "done";

interface SaveAnswerModalProps {
  content: string;
  defaultTitle?: string;
  onClose: () => void;
}

export function SaveAnswerModal({
  content,
  defaultTitle = "Study AI notes",
  onClose,
}: SaveAnswerModalProps) {
  const [mode, setMode] = useState<SaveMode>("choose");
  const [title, setTitle] = useState(defaultTitle);
  const [subjects, setSubjects] = useState<UserSubject[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [notebookId, setNotebookId] = useState("");
  const [topicId, setTopicId] = useState("");
  const [topics, setTopics] = useState<UserTopicGroup[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [savedHref, setSavedHref] = useState("");
  const [downloadedAs, setDownloadedAs] = useState<DownloadFormat | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const loadSubjects = useCallback(() => {
    setSubjectsLoading(true);
    api.myContent
      .listSubjects({ pageSize: 100, sort: "name" })
      .then(({ subjects: list }) => setSubjects(list))
      .catch(() => setError("Could not load folders"))
      .finally(() => setSubjectsLoading(false));
  }, []);

  useEffect(() => {
    if (mode === "library") loadSubjects();
  }, [mode, loadSubjects]);

  useEffect(() => {
    if (!notebookId) {
      setTopics([]);
      setTopicId("");
      setTopicsLoading(false);
      return;
    }
    const nb = subjects.find((s) => s.id === notebookId);
    if (nb?.topicGroups?.length) {
      setTopics(nb.topicGroups);
      setTopicsLoading(false);
      return;
    }
    const slug = nb?.slug;
    if (!slug) return;
    setTopicsLoading(true);
    api.myContent
      .getSubject(slug)
      .then(({ subject }) => {
        setTopics(subject.topicGroups ?? []);
      })
      .catch(() => setTopics([]))
      .finally(() => setTopicsLoading(false));
  }, [notebookId, subjects]);

  const runDownload = async (format: DownloadFormat) => {
    setBusy(true);
    setError("");
    try {
      await downloadAnswer(format, title, content);
      setDownloadedAs(format);
      setMode("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed");
    } finally {
      setBusy(false);
    }
  };

  const saveToLibrary = async () => {
    const pageTitle = title.trim() || "Study AI notes";
    setBusy(true);
    setError("");
    try {
      const htmlContent = `<article class="study-ai-saved">${markdownToExportHtml(content)}</article>`;
      let page: { slug: string; title: string };
      let href = "/my-content";

      if (!notebookId) {
        const res = await api.myContent.createRootPage({
          title: pageTitle,
          htmlContent,
        });
        page = res.page;
        href = `/my-content/file/${page.slug}`;
      } else if (!topicId) {
        const res = await api.myContent.createNotebookPage(notebookId, {
          title: pageTitle,
          htmlContent,
        });
        page = res.page;
        const nb = subjects.find((s) => s.id === notebookId);
        href = `/my-content/${nb?.slug ?? "file"}/file/${page.slug}`;
      } else {
        const res = await api.myContent.createPage(notebookId, topicId, {
          title: pageTitle,
          htmlContent,
        });
        page = res.page;
        const nb = subjects.find((s) => s.id === notebookId);
        const topic = topics.find((t) => t.id === topicId);
        href = `/my-content/${nb?.slug}/${topic?.slug}/${page.slug}`;
      }
      setSavedHref(href);
      setDownloadedAs(null);
      setMode("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  };

  const formats: Array<{
    format: DownloadFormat;
    label: string;
    hint: string;
  }> = [
    { format: "md", label: "Markdown", hint: ".md — best for notes apps" },
    { format: "pdf", label: "PDF", hint: ".pdf — ready to share or print" },
    { format: "doc", label: "Word", hint: ".doc — opens in Word / Docs" },
  ];

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-label="Save or download answer"
        className="relative w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-2xl p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-[var(--text-primary)]">
            {mode === "done"
              ? "Saved"
              : mode === "library"
                ? "Save to library"
                : mode === "download"
                  ? "Download"
                  : "Save answer"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-secondary)]"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {mode === "choose" && (
          <div className="space-y-3">
            <p className="text-[13px] text-[var(--text-secondary)]">
              Download this answer, or save it as a new file in your library.
            </p>
            <button
              type="button"
              onClick={() => setMode("download")}
              className="w-full flex items-center gap-3 rounded-[10px] border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3 text-left hover:border-[var(--accent)] transition-colors"
            >
              <Download className="w-4 h-4 text-[var(--accent)] shrink-0" />
              <span>
                <span className="block text-[13px] font-medium text-[var(--text-primary)]">
                  Download
                </span>
                <span className="block text-[12px] text-[var(--text-muted)]">
                  Markdown, PDF, or Word
                </span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => setMode("library")}
              className="w-full flex items-center gap-3 rounded-[10px] border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3 text-left hover:border-[var(--accent)] transition-colors"
            >
              <FolderPlus className="w-4 h-4 text-[var(--accent)] shrink-0" />
              <span>
                <span className="block text-[13px] font-medium text-[var(--text-primary)]">
                  Save to library
                </span>
                <span className="block text-[12px] text-[var(--text-muted)]">
                  Pick folder or nested folder, or library root
                </span>
              </span>
            </button>
          </div>
        )}

        {mode === "download" && (
          <div className="space-y-3">
            <label className="block">
              <span className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
                File name
              </span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-[13px] outline-none focus:border-[var(--accent)]"
              />
            </label>
            <div className="space-y-2">
              {formats.map((f) => (
                <button
                  key={f.format}
                  type="button"
                  disabled={busy}
                  onClick={() => void runDownload(f.format)}
                  className="w-full flex items-center gap-3 rounded-[10px] border border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3 text-left hover:border-[var(--accent)] transition-colors disabled:opacity-50"
                >
                  <FileText className="w-4 h-4 text-[var(--accent)] shrink-0" />
                  <span>
                    <span className="block text-[13px] font-medium text-[var(--text-primary)]">
                      {f.label}
                    </span>
                    <span className="block text-[12px] text-[var(--text-muted)]">
                      {f.hint}
                    </span>
                  </span>
                </button>
              ))}
            </div>
            {error && (
              <p className="text-xs text-red-400 leading-relaxed">{error}</p>
            )}
            <button
              type="button"
              onClick={() => {
                setError("");
                setMode("choose");
              }}
              className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-[13px] text-[var(--text-secondary)]"
            >
              Back
            </button>
          </div>
        )}

        {mode === "library" && (
          <div className="space-y-3">
            {subjectsLoading ? (
              <div className="flex justify-center py-8">
                <CircleLoader size="md" label="Loading folders" />
              </div>
            ) : (
              <>
            <label className="block">
              <span className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
                File name
              </span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-[13px] outline-none focus:border-[var(--accent)]"
              />
            </label>
            <label className="block">
              <span className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
                Folder (optional)
              </span>
              <ShelfSelect
                value={notebookId}
                options={[
                  { value: "", label: "Library root" },
                  ...subjects.map((s) => ({ value: s.id, label: s.name })),
                ]}
                className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-[13px]"
                aria-label="Folder"
                onChange={(v) => {
                  setNotebookId(v);
                  setTopicId("");
                }}
              />
            </label>
            {notebookId && (
              <label className="block">
                <span className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">
                  Nested folder (optional)
                </span>
                {topicsLoading ? (
                  <div className="mt-2 flex justify-center py-3">
                    <CircleLoader size="sm" label="Loading folders" />
                  </div>
                ) : (
                <ShelfSelect
                  value={topicId}
                  options={[
                    { value: "", label: "Top-level file in folder" },
                    ...topics.map((t) => ({ value: t.id, label: t.title })),
                  ]}
                  className="mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-[13px]"
                  aria-label="Nested folder"
                  onChange={setTopicId}
                />
                )}
              </label>
            )}
              </>
            )}
            {error && (
              <p className="text-xs text-red-400 leading-relaxed">{error}</p>
            )}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setMode("choose")}
                className="flex-1 rounded-lg border border-[var(--border)] px-3 py-2 text-[13px] text-[var(--text-secondary)]"
              >
                Back
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void saveToLibrary()}
                className="flex-1 rounded-lg bg-[var(--accent)] px-3 py-2 text-[13px] text-white disabled:opacity-50"
              >
                {busy ? "Saving…" : "Save file"}
              </button>
            </div>
          </div>
        )}

        {mode === "done" && (
          <div className="space-y-3">
            <p className="text-[13px] text-[var(--text-secondary)]">
              {savedHref
                ? "Answer saved as a new file in your library."
                : downloadedAs === "pdf"
                  ? "PDF download started."
                  : downloadedAs === "doc"
                    ? "Word download started."
                    : "Markdown download started."}
            </p>
            {savedHref && (
              <a
                href={savedHref}
                className="inline-block text-[13px] text-[var(--accent)] hover:underline"
              >
                Open file
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-lg bg-[var(--accent)] px-3 py-2 text-[13px] text-white"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
