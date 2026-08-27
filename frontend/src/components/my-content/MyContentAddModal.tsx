"use client";

import { useEffect, useRef } from "react";
import { FolderUp, PenLine, FileText, Upload, X } from "lucide-react";
import { FileUploadZone } from "@/components/FileUploadZone";
import { FolderUploadZone } from "@/components/my-content/FolderUploadZone";
import type { UploadProgress } from "@/lib/api";
import {
  SKETCH_BACKGROUNDS,
  SKETCH_TEMPLATES,
  type SketchTemplate,
} from "@/lib/sketchNotebook";

export type AddModalKind = "notebook" | "topic" | "page";
export type PageAddMode = "file" | "bulk" | "sketch" | "doc" | "link";

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function submitLabel(
  addMode: PageAddMode,
  submitting: boolean,
  uploadProgress: UploadProgress | null
) {
  if (submitting && addMode === "bulk") return "Importing…";
  if (submitting && addMode === "file") {
    if (uploadProgress?.phase === "compressing") return "Compressing…";
    if (uploadProgress && uploadProgress.percent < 100) {
      return `Uploading ${uploadProgress.percent}%`;
    }
    return "Saving…";
  }
  if (submitting && addMode === "link") return "Adding…";
  if (submitting) return "Creating…";
  if (addMode === "link") return "Add link";
  if (addMode === "bulk") {
    return (
      <>
        <FolderUp className="w-4 h-4" />
        Import folders
      </>
    );
  }
  if (addMode === "file") {
    return (
      <>
        <Upload className="w-4 h-4" />
        Upload
      </>
    );
  }
  if (addMode === "sketch") {
    return (
      <>
        <PenLine className="w-4 h-4" />
        Create notebook
      </>
    );
  }
  return (
    <>
      <FileText className="w-4 h-4" />
      Create doc
    </>
  );
}

function UploadProgressBar({ progress }: { progress: UploadProgress }) {
  const compressing = progress.phase === "compressing";
  const saving = !compressing && progress.percent >= 100;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3 text-xs text-[var(--text-muted)]">
        <span>
          {compressing
            ? "Compressing…"
            : saving
              ? "Saving to library…"
              : "Uploading"}
        </span>
        <span className="tabular-nums text-[var(--text-secondary)]">
          {compressing
            ? "Preparing file"
            : saving
              ? "100%"
              : progress.total > 0
                ? `${formatBytes(progress.loaded)} of ${formatBytes(progress.total)} · ${progress.percent}%`
                : `${progress.percent}%`}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label="Upload progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress.percent}
        className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-secondary)]"
      >
        <div
          className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-150 ease-out"
          style={{
            width: compressing
              ? "18%"
              : `${Math.max(saving ? 100 : progress.percent, 2)}%`,
          }}
        />
      </div>
    </div>
  );
}

interface MyContentAddModalProps {
  kind: AddModalKind;
  notebookName?: string;
  topicTitle?: string;
  needsTopicName?: boolean;
  notebookNameInput: string;
  notebookDesc: string;
  topicTitleInput: string;
  pageTitle: string;
  addMode: PageAddMode;
  pageLink: string;
  uploadFile: File | null;
  bulkFiles: File[];
  bulkProgress: { done: number; total: number; label: string } | null;
  submitting: boolean;
  uploadProgress: UploadProgress | null;
  message: string;
  sketchTemplate: SketchTemplate;
  sketchBg: string;
  onNotebookNameChange: (v: string) => void;
  onNotebookDescChange: (v: string) => void;
  onTopicTitleChange: (v: string) => void;
  onPageTitleChange: (v: string) => void;
  onAddModeChange: (mode: PageAddMode) => void;
  onPageLinkChange: (v: string) => void;
  onUploadFileChange: (f: File | null) => void;
  onBulkFilesChange: (files: File[]) => void;
  onSketchTemplateChange: (t: SketchTemplate) => void;
  onSketchBgChange: (c: string) => void;
  onSubmitNotebook: (e: React.FormEvent) => void;
  onSubmitTopic: (e: React.FormEvent) => void;
  onSubmitPage: (e: React.FormEvent) => void;
  onClose: () => void;
}

export function MyContentAddModal({
  kind,
  notebookName,
  topicTitle,
  needsTopicName = false,
  notebookNameInput,
  notebookDesc,
  topicTitleInput,
  pageTitle,
  addMode,
  pageLink,
  uploadFile,
  bulkFiles,
  bulkProgress,
  submitting,
  uploadProgress,
  message,
  onNotebookNameChange,
  onNotebookDescChange,
  onTopicTitleChange,
  onPageTitleChange,
  onAddModeChange,
  onPageLinkChange,
  onUploadFileChange,
  onBulkFilesChange,
  sketchTemplate,
  sketchBg,
  onSketchTemplateChange,
  onSketchBgChange,
  onSubmitNotebook,
  onSubmitTopic,
  onSubmitPage,
  onClose,
}: MyContentAddModalProps) {
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, submitting]);

  useEffect(() => {
    const background = document.activeElement;
    if (
      background instanceof HTMLElement &&
      !background.closest('[role="dialog"]')
    ) {
      background.blur();
    }
    const id = requestAnimationFrame(() => {
      const first = formRef.current?.querySelector<HTMLElement>(
        "input:not([disabled]), textarea:not([disabled])"
      );
      first?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, []);

  const title =
    kind === "notebook"
      ? "New collection"
      : kind === "topic"
        ? `New topic in ${notebookName ?? "…"}`
        : !notebookName
          ? "Add to library"
          : topicTitle
            ? `Add page · ${topicTitle}`
            : `Add to ${notebookName}`;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/50"
        onClick={() => {
          if (!submitting) onClose();
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-2xl p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-[var(--text-primary)]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] disabled:opacity-40 disabled:pointer-events-none"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {kind === "notebook" && (
          <form ref={formRef} onSubmit={onSubmitNotebook} className="space-y-3">
            <input
              type="text"
              placeholder="Collection name (e.g. UPSC Polity)"
              value={notebookNameInput}
              onChange={(e) => onNotebookNameChange(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]"
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={notebookDesc}
              onChange={(e) => onNotebookDescChange(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]"
            />
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? "Creating…" : "Create collection"}
            </button>
          </form>
        )}

        {kind === "topic" && (
          <form ref={formRef} onSubmit={onSubmitTopic} className="space-y-3">
            <input
              type="text"
              placeholder="Topic name (e.g. Fundamental Rights)"
              value={topicTitleInput}
              onChange={(e) => onTopicTitleChange(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]"
            />
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? "Creating…" : "Create topic"}
            </button>
          </form>
        )}

        {kind === "page" && (
          <form ref={formRef} onSubmit={onSubmitPage} className="space-y-3">
            {needsTopicName && (
              <input
                type="text"
                placeholder="Topic name"
                value={topicTitleInput}
                onChange={(e) => onTopicTitleChange(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]"
              />
            )}
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ["file", "Upload"],
                  ["bulk", "Folders"],
                  ["link", "Link"],
                  ["sketch", "Notebook"],
                  ["doc", "Doc"],
                ] as const
              ).map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  disabled={submitting}
                  onClick={() => onAddModeChange(mode)}
                  className={`py-2 rounded-lg text-sm border disabled:opacity-50 ${addMode === mode ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--accent-light)]" : "border-[var(--border)]"}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Page title"
              value={pageTitle}
              onChange={(e) => onPageTitleChange(e.target.value)}
              required={addMode !== "bulk"}
              disabled={submitting || addMode === "bulk"}
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] disabled:opacity-60"
            />
            {addMode === "bulk" && !notebookName ? (
              <>
                <input
                  type="text"
                  placeholder="Collection name for this import"
                  value={notebookNameInput}
                  onChange={(e) => onNotebookNameChange(e.target.value)}
                  required
                  disabled={submitting}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] disabled:opacity-60"
                />
                <p className="text-xs text-[var(--text-muted)]">
                  Each selected folder becomes a topic; PDFs inside are uploaded as pages.
                </p>
              </>
            ) : null}
            {addMode === "bulk" && notebookName ? (
              <p className="text-xs text-[var(--text-muted)]">
                Importing into {notebookName}. Folder names become topics; PDFs inside become pages.
              </p>
            ) : null}
            {addMode === "bulk" && (
              <>
                <FolderUploadZone
                  files={bulkFiles}
                  onChange={onBulkFilesChange}
                  disabled={submitting}
                />
                {submitting && bulkProgress ? (
                  <UploadProgressBar
                    progress={{
                      loaded: bulkProgress.done,
                      total: bulkProgress.total,
                      percent: Math.round(
                        (bulkProgress.done / Math.max(bulkProgress.total, 1)) * 100
                      ),
                    }}
                  />
                ) : null}
                {submitting && bulkProgress ? (
                  <p className="text-xs text-[var(--text-muted)] truncate">
                    {bulkProgress.label}
                  </p>
                ) : null}
              </>
            )}
            {addMode === "file" && (
              <>
                <FileUploadZone
                  file={uploadFile}
                  onChange={onUploadFileChange}
                  disabled={submitting}
                  progress={uploadProgress}
                  accept=".pdf,.txt,.md,.markdown,.docx,application/pdf,text/plain,text/markdown,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  label="Drop a file or click to browse"
                />
                {submitting && uploadProgress ? (
                  <UploadProgressBar progress={uploadProgress} />
                ) : (
                  <p className="text-xs text-[var(--text-muted)]">
                    Drag a file here, or click to browse. PDF, TXT, MD, or DOCX.
                  </p>
                )}
              </>
            )}
            {addMode === "link" && (
              <>
                <input
                  type="url"
                  placeholder="https://… website or PDF URL"
                  value={pageLink}
                  onChange={(e) => onPageLinkChange(e.target.value)}
                  required
                  disabled={submitting}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] disabled:opacity-60"
                />
                <p className="text-xs text-[var(--text-muted)]">
                  Some sites block embedding — use Open in the reader.
                </p>
              </>
            )}
            {addMode === "sketch" && (
              <div className="space-y-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-3">
                <p className="text-xs text-[var(--text-muted)]">
                  Draw on fixed pages — add more sheets as you go. Pick paper style and color.
                </p>
                <div>
                  <span className="text-xs text-[var(--text-muted)] block mb-1.5">
                    Paper style
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {SKETCH_TEMPLATES.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        title={t.hint}
                        disabled={submitting}
                        onClick={() => onSketchTemplateChange(t.id)}
                        className={`px-2.5 py-1 rounded-md text-xs border ${
                          sketchTemplate === t.id
                            ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--accent-light)]"
                            : "border-[var(--border)] text-[var(--text-secondary)]"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-[var(--text-muted)] block mb-1.5">
                    Background
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {SKETCH_BACKGROUNDS.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        title={c.label}
                        disabled={submitting}
                        onClick={() => onSketchBgChange(c.color)}
                        className={`w-7 h-7 rounded-md border-2 ${
                          sketchBg === c.color
                            ? "border-[var(--accent)] scale-110"
                            : "border-[var(--border)]"
                        }`}
                        style={{ background: c.color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            {addMode === "doc" && (
              <p className="text-xs text-[var(--text-muted)] rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2">
                A typed document with headings, lists, fonts, and colors — no drawing canvas.
              </p>
            )}
            {message && <p className="text-sm text-red-500">{message}</p>}
            <button
              type="submit"
              disabled={
                submitting ||
                (addMode === "file" && !uploadFile) ||
                (addMode === "bulk" &&
                  (bulkFiles.length === 0 ||
                    (!notebookName && !notebookNameInput.trim()))) ||
                (addMode === "link" && !pageLink.trim())
              }
              className="btn-primary w-full sm:w-auto"
            >
              {submitLabel(addMode, submitting, uploadProgress)}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
