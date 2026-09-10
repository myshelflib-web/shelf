"use client";

import {
  SKETCH_BACKGROUNDS,
  SKETCH_TEMPLATES,
  type SketchTemplate,
} from "@/lib/sketchNotebook";
import { DOC_TEMPLATES, type DocTemplateId } from "@/lib/docTemplates";
import type { UploadProgress } from "@/lib/api";
import { LibraryUploadZone } from "@/components/my-content/LibraryUploadZone";
import {
  AddUploadProgressBar,
  PAGE_ADD_MODE_ROWS,
  pageAddSubmitLabel,
  type PageAddMode,
} from "./myContentAddModalBits";
import { titleFromFile } from "./myContentAddUtils";

export type MyContentAddPageFormProps = {
  notebookName?: string;
  needsTopicName?: boolean;
  notebookNameInput: string;
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
  uploadRejectedCount: number;
  sketchTemplate: SketchTemplate;
  sketchBg: string;
  docTemplate: DocTemplateId;
  formRef: React.RefObject<HTMLFormElement | null>;
  onNotebookNameChange: (v: string) => void;
  onTopicTitleChange: (v: string) => void;
  onPageTitleChange: (v: string) => void;
  onAddModeChange: (mode: PageAddMode) => void;
  onPageLinkChange: (v: string) => void;
  onUploadFileChange: (f: File | null) => void;
  onBulkFilesChange: (files: File[]) => void;
  onUploadRejectedCountChange: (n: number) => void;
  onSketchTemplateChange: (t: SketchTemplate) => void;
  onSketchBgChange: (c: string) => void;
  onDocTemplateChange: (t: DocTemplateId) => void;
  onSubmitPage: (e: React.FormEvent) => void;
};

export function MyContentAddPageForm({
  notebookName,
  needsTopicName = false,
  notebookNameInput,
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
  uploadRejectedCount,
  sketchTemplate,
  sketchBg,
  docTemplate,
  formRef,
  onNotebookNameChange,
  onTopicTitleChange,
  onPageTitleChange,
  onAddModeChange,
  onPageLinkChange,
  onUploadFileChange,
  onBulkFilesChange,
  onUploadRejectedCountChange,
  onSketchTemplateChange,
  onSketchBgChange,
  onDocTemplateChange,
  onSubmitPage,
}: MyContentAddPageFormProps) {
  const isUploadTab = addMode === "file" || addMode === "bulk";
  const multiUpload = bulkFiles.length > 0;

  return (
    <form ref={formRef} onSubmit={onSubmitPage} className="space-y-3">
      {needsTopicName && (
        <input
          type="text"
          placeholder="Folder name"
          value={topicTitleInput}
          onChange={(e) => onTopicTitleChange(e.target.value)}
          required
          className="w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]"
        />
      )}
      <div className="space-y-2">
        {PAGE_ADD_MODE_ROWS.map((row, rowIdx) => (
          <div
            key={rowIdx}
            className={
              row.length === 3
                ? "grid grid-cols-3 gap-2"
                : "flex justify-center gap-2"
            }
          >
            {row.map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                disabled={submitting}
                onClick={() => onAddModeChange(mode)}
                className={`py-2 rounded-lg text-sm border transition-colors disabled:opacity-50 ${
                  row.length < 3 ? "w-[calc((100%-1rem)/3)]" : ""
                } ${
                  addMode === mode || (mode === "file" && addMode === "bulk")
                    ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--accent-light)]"
                    : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)]/35 hover:text-[var(--text-primary)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        ))}
      </div>
      {!isUploadTab || (uploadFile && !multiUpload) ? (
        <input
          type="text"
          placeholder={
            addMode === "youtube"
              ? "Title (optional — from YouTube)"
              : "File name"
          }
          value={pageTitle}
          onChange={(e) => onPageTitleChange(e.target.value)}
          required={addMode !== "youtube" && !isUploadTab}
          disabled={submitting}
          className="w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)] disabled:opacity-60"
        />
      ) : null}
      {isUploadTab && multiUpload && !notebookName ? (
        <>
          <input
            type="text"
            placeholder="Folder name for this import"
            value={notebookNameInput}
            onChange={(e) => onNotebookNameChange(e.target.value)}
            required
            disabled={submitting}
            className="w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)] disabled:opacity-60"
          />
          <p className="text-xs text-[var(--text-muted)]">
            Each selected folder becomes a subfolder; only PDF, TXT, MD, and
            DOCX files are uploaded.
          </p>
        </>
      ) : null}
      {isUploadTab && multiUpload && notebookName ? (
        <p className="text-xs text-[var(--text-muted)]">
          Importing into {notebookName}. Folder names become subfolders;
          unsupported formats are skipped.
        </p>
      ) : null}
      {isUploadTab && (
        <>
          <LibraryUploadZone
            files={
              bulkFiles.length > 0 ? bulkFiles : uploadFile ? [uploadFile] : []
            }
            disabled={submitting}
            onChange={(selection) => {
              if (!selection) {
                onUploadFileChange(null);
                onBulkFilesChange([]);
                onUploadRejectedCountChange(0);
                return;
              }
              onUploadRejectedCountChange(selection.rejected);
              if (selection.kind === "single") {
                onBulkFilesChange([]);
                onUploadFileChange(selection.file);
                onPageTitleChange(titleFromFile(selection.file));
                return;
              }
              onUploadFileChange(null);
              onBulkFilesChange(selection.files);
            }}
          />
          {uploadRejectedCount > 0 ? (
            <p className="text-xs text-amber-400/90">
              Skipped {uploadRejectedCount} unsupported file
              {uploadRejectedCount === 1 ? "" : "s"} (PDF, TXT, MD, DOCX only).
            </p>
          ) : null}
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
          {submitting && uploadProgress && !multiUpload ? (
            <AddUploadProgressBar progress={uploadProgress} />
          ) : null}
          {!submitting ? (
            <p className="text-xs text-[var(--text-muted)]">
              Files or folders. PDF, TXT, MD, or DOCX only — other formats are
              ignored.
            </p>
          ) : null}
          <p className="text-xs text-[var(--text-muted)]">
            By uploading you confirm you have the right to store this file (your
            own work or material you may legally use). See our{" "}
            <a
              href="/legal/copyright"
              className="text-[var(--accent)] hover:underline"
            >
              copyright policy
            </a>
            .
          </p>
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
            One lecture becomes a file. A playlist becomes a folder (or a
            top-level folder at library root) with a file per video — watch and
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
            Some sites block embedding — use Open in the reader. YouTube links
            should use the YouTube tab.
          </p>
        </>
      )}
      {addMode === "sketch" && (
        <div className="space-y-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-3">
          <p className="text-xs text-[var(--text-muted)]">
            Draw on fixed pages — add more sheets as you go. Pick paper style and
            color.
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
        <div className="space-y-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2">
          <p className="text-xs text-[var(--text-muted)]">
            Choose a research template — blank stays empty except for the title.
          </p>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {DOC_TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onDocTemplateChange(t.id)}
                className={`rounded-md border px-2 py-1.5 text-left transition-colors ${
                  docTemplate === t.id
                    ? "border-[var(--accent)] bg-[var(--accent-light)]"
                    : "border-[var(--border)] bg-[var(--bg-elevated)]"
                }`}
              >
                <span className="block text-[11px] font-semibold text-[var(--text-primary)]">
                  {t.name}
                </span>
                <span className="block text-[10px] text-[var(--text-muted)] line-clamp-2">
                  {t.description}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
      {message && <p className="text-sm text-red-500">{message}</p>}
      <button
        type="submit"
        disabled={
          submitting ||
          (isUploadTab && !uploadFile && bulkFiles.length === 0) ||
          (isUploadTab &&
            multiUpload &&
            !notebookName &&
            !notebookNameInput.trim()) ||
          ((addMode === "link" || addMode === "youtube") && !pageLink.trim())
        }
        className="btn-primary w-full sm:w-auto"
      >
        {pageAddSubmitLabel(addMode, submitting, uploadProgress, {
          multiFile: multiUpload,
        })}
      </button>
    </form>
  );
}
