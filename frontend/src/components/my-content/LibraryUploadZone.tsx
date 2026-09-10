"use client";

import { useCallback, useRef, useState } from "react";
import { Upload } from "lucide-react";
import clsx from "clsx";
import {
  isUploadableFile,
  mergeUploadableFiles,
  relativeUploadPath,
} from "./myContentAddUtils";

export type LibraryUploadSelection =
  | { kind: "single"; file: File; rejected: number }
  | { kind: "multi"; files: File[]; rejected: number };

interface LibraryUploadZoneProps {
  /** Currently selected files (0, 1, or many). */
  files: File[];
  onChange: (selection: LibraryUploadSelection | null) => void;
  disabled?: boolean;
  label?: string;
}

function looksLikeFolderSelection(files: File[]): boolean {
  if (files.length === 0) return false;
  if (files.length > 1) return true;
  return relativeUploadPath(files[0]!).includes("/");
}

export function LibraryUploadZone({
  files,
  onChange,
  disabled = false,
  label = "Drop files or folders",
}: LibraryUploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const applyIncoming = useCallback(
    (incoming: File[], merge: boolean) => {
      if (disabled || incoming.length === 0) return;
      const rejected = incoming.filter((f) => !isUploadableFile(f)).length;
      const uploadable = incoming.filter(isUploadableFile);
      if (uploadable.length === 0) {
        onChange({ kind: "multi", files: [], rejected });
        return;
      }
      const next = merge
        ? mergeUploadableFiles(files, uploadable)
        : mergeUploadableFiles([], uploadable);
      if (next.length === 1 && !looksLikeFolderSelection(next)) {
        onChange({ kind: "single", file: next[0]!, rejected });
        return;
      }
      onChange({ kind: "multi", files: next, rejected });
    },
    [disabled, files, onChange]
  );

  const folderCount = new Set(
    files
      .map((f) => relativeUploadPath(f).split("/").filter(Boolean)[0])
      .filter(Boolean)
  ).size;
  const multi = files.length > 1 || looksLikeFolderSelection(files);

  return (
    <div
      onDragEnter={(e) => {
        if (disabled || ![...e.dataTransfer.types].includes("Files")) return;
        e.preventDefault();
        e.stopPropagation();
        setDragOver(true);
      }}
      onDragOver={(e) => {
        if (disabled || ![...e.dataTransfer.types].includes("Files")) return;
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = "copy";
        setDragOver(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
        if (disabled) return;
        applyIncoming(Array.from(e.dataTransfer.files ?? []), false);
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.txt,.md,.markdown,.docx,application/pdf,text/plain,text/markdown,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        disabled={disabled}
        className="sr-only"
        onChange={(e) => {
          applyIncoming(Array.from(e.target.files ?? []), false);
          e.target.value = "";
        }}
      />
      <input
        ref={folderInputRef}
        type="file"
        multiple
        // @ts-expect-error — non-standard directory picker (Chromium / Safari)
        webkitdirectory=""
        disabled={disabled}
        className="sr-only"
        onChange={(e) => {
          applyIncoming(Array.from(e.target.files ?? []), true);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) fileInputRef.current?.click();
        }}
        className={clsx(
          "file-upload-zone w-full group",
          dragOver && !disabled && "file-upload-zone-active",
          disabled && "pointer-events-none opacity-80"
        )}
      >
        <span className="file-upload-icon">
          <Upload className="w-5 h-5" />
        </span>
        <span className="flex flex-col items-start min-w-0 text-left">
          <span className="font-medium text-sm text-[var(--text-primary)]">
            {files.length === 0
              ? label
              : multi
                ? `${files.length} file${files.length === 1 ? "" : "s"} selected`
                : files[0]!.name}
          </span>
          <span className="text-xs text-[var(--text-muted)] truncate max-w-full">
            {files.length > 0
              ? multi
                ? `${folderCount} folder${folderCount === 1 ? "" : "s"} · click to change`
                : `${(files[0]!.size / 1024 / 1024).toFixed(2)} MB · click or drop to change`
              : dragOver
                ? "Drop to upload"
                : "Drag & drop or click · PDF, TXT, MD, DOCX"}
          </span>
        </span>
      </button>
      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
        <button
          type="button"
          disabled={disabled}
          className="text-[var(--accent)] hover:underline disabled:opacity-50"
          onClick={() => {
            if (!disabled) fileInputRef.current?.click();
          }}
        >
          Choose files
        </button>
        <button
          type="button"
          disabled={disabled}
          className="text-[var(--accent)] hover:underline disabled:opacity-50"
          onClick={() => {
            if (!disabled) folderInputRef.current?.click();
          }}
        >
          Choose folders
        </button>
        {files.length > 0 ? (
          <button
            type="button"
            disabled={disabled}
            className="text-[var(--text-muted)] hover:underline disabled:opacity-50"
            onClick={() => onChange(null)}
          >
            Clear
          </button>
        ) : null}
      </div>
    </div>
  );
}
