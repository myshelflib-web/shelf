"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import type { UploadProgress } from "@/lib/api";
import type { SketchTemplate } from "@/lib/sketchNotebook";
import type { DocTemplateId } from "@/lib/docTemplates";
import type { PageAddMode } from "./myContentAddModalBits";
import { MyContentAddPageForm } from "./MyContentAddPageForm";

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
  uploadRejectedCount?: number;
  sketchTemplate: SketchTemplate;
  sketchBg: string;
  docTemplate: DocTemplateId;
  onNotebookNameChange: (v: string) => void;
  onNotebookDescChange: (v: string) => void;
  onTopicTitleChange: (v: string) => void;
  onPageTitleChange: (v: string) => void;
  onAddModeChange: (mode: PageAddMode) => void;
  onPageLinkChange: (v: string) => void;
  onUploadFileChange: (f: File | null) => void;
  onBulkFilesChange: (files: File[]) => void;
  onUploadRejectedCountChange?: (n: number) => void;
  onSketchTemplateChange: (t: SketchTemplate) => void;
  onSketchBgChange: (c: string) => void;
  onDocTemplateChange: (t: DocTemplateId) => void;
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
  uploadRejectedCount = 0,
  onNotebookNameChange,
  onNotebookDescChange,
  onTopicTitleChange,
  onPageTitleChange,
  onAddModeChange,
  onPageLinkChange,
  onUploadFileChange,
  onBulkFilesChange,
  onUploadRejectedCountChange,
  sketchTemplate,
  sketchBg,
  onSketchTemplateChange,
  onSketchBgChange,
  docTemplate,
  onDocTemplateChange,
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
      ? "New folder"
      : kind === "topic"
        ? `New folder in ${topicTitle ?? notebookName ?? "…"}`
        : !notebookName
          ? "Add to library"
          : topicTitle
            ? `Add file · ${topicTitle}`
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
              placeholder="Folder name (e.g. UPSC Polity)"
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
              {submitting ? "Creating…" : "Create folder"}
            </button>
          </form>
        )}

        {kind === "topic" && (
          <form ref={formRef} onSubmit={onSubmitTopic} className="space-y-3">
            <input
              type="text"
              placeholder="Folder name (e.g. Fundamental Rights)"
              value={topicTitleInput}
              onChange={(e) => onTopicTitleChange(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]"
            />
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? "Creating…" : "Create folder"}
            </button>
          </form>
        )}

        {kind === "page" && (
          <MyContentAddPageForm
            notebookName={notebookName}
            needsTopicName={needsTopicName}
            notebookNameInput={notebookNameInput}
            topicTitleInput={topicTitleInput}
            pageTitle={pageTitle}
            addMode={addMode}
            pageLink={pageLink}
            uploadFile={uploadFile}
            bulkFiles={bulkFiles}
            bulkProgress={bulkProgress}
            submitting={submitting}
            uploadProgress={uploadProgress}
            message={message}
            uploadRejectedCount={uploadRejectedCount}
            sketchTemplate={sketchTemplate}
            sketchBg={sketchBg}
            docTemplate={docTemplate}
            formRef={formRef}
            onNotebookNameChange={onNotebookNameChange}
            onTopicTitleChange={onTopicTitleChange}
            onPageTitleChange={onPageTitleChange}
            onAddModeChange={onAddModeChange}
            onPageLinkChange={onPageLinkChange}
            onUploadFileChange={onUploadFileChange}
            onBulkFilesChange={onBulkFilesChange}
            onUploadRejectedCountChange={onUploadRejectedCountChange ?? (() => {})}
            onSketchTemplateChange={onSketchTemplateChange}
            onSketchBgChange={onSketchBgChange}
            onDocTemplateChange={onDocTemplateChange}
            onSubmitPage={onSubmitPage}
          />
        )}
      </div>
    </div>
  );
}
