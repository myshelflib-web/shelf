"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { FileUploadZone } from "@/components/FileUploadZone";
import { FolderUploadZone } from "@/components/my-content/FolderUploadZone";
import type { UploadProgress } from "@/lib/api";
import {
  SKETCH_BACKGROUNDS,
  SKETCH_TEMPLATES,
  type SketchTemplate,
} from "@/lib/sketchNotebook";
import {
  AddUploadProgressBar,
  PAGE_ADD_MODES,
  pageAddSubmitLabel,
  type PageAddMode,
} from "./myContentAddModalBits";

export type AddModalKind = "notebook" | "topic" | "page";
export type { PageAddMode };


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
            <div className="grid grid-cols-3 gap-2">
              {PAGE_ADD_MODES.map(([mode, label]) => (
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
              placeholder={
                addMode === "youtube"
                  ? "Title (optional — from YouTube)"
                  : "Page title"
              }
              value={pageTitle}
              onChange={(e) => onPageTitleChange(e.target.value)}
              required={addMode !== "bulk" && addMode !== "youtube"}
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
                  <AddUploadProgressBar
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
                  <AddUploadProgressBar progress={uploadProgress} />
                ) : (
                  <p className="text-xs text-[var(--text-muted)]">
                    Drag a file here, or click to browse. PDF, TXT, MD, or DOCX.
                  </p>
                )}
              </>
            )}
            {addMode === "youtube" && (
              <>
                <input
                  type="url"
                  placeholder="https://youtube.com/watch… or playlist"
                  value={pageLink}
                  onChange={(e) => onPageLinkChange(e.target.value)}
                  required
                  disabled={submitting}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] disabled:opacity-60"
                />
                <p className="text-xs text-[var(--text-muted)]">
                  One lecture becomes a page. A playlist becomes a topic (or a
                  collection at library root) with a page per video — watch and
                  take notes in the same reader.
                </p>
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
                  Some sites block embedding — use Open in the reader. YouTube
                  links should use the YouTube tab.
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
                ((addMode === "link" || addMode === "youtube") &&
                  !pageLink.trim())
              }
              className="btn-primary w-full sm:w-auto"
            >
              {pageAddSubmitLabel(addMode, submitting, uploadProgress)}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
