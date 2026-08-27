"use client";

import { useCallback, useRef, useState } from "react";
import { FolderUp } from "lucide-react";
import clsx from "clsx";
import { isUploadableFile } from "./myContentAddUtils";

interface FolderUploadZoneProps {
  files: File[];
  onChange: (files: File[]) => void;
  disabled?: boolean;
  label?: string;
}

function relativePath(file: File): string {
  return (
    (file as File & { webkitRelativePath?: string }).webkitRelativePath ||
    file.name
  );
}

function mergeUploadableFiles(existing: File[], incoming: File[]): File[] {
  const seen = new Set(
    existing.map((f) => `${f.name}:${f.size}:${relativePath(f)}`)
  );
  const next = [...existing];
  for (const file of incoming) {
    if (!isUploadableFile(file)) continue;
    const key = `${file.name}:${file.size}:${relativePath(file)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    next.push(file);
  }
  return next;
}

export function FolderUploadZone({
  files,
  onChange,
  disabled = false,
  label = "Choose folders",
}: FolderUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const takeFiles = useCallback(
    (incoming: File[]) => {
      if (disabled || incoming.length === 0) return;
      onChange(mergeUploadableFiles(files, incoming));
    },
    [disabled, files, onChange]
  );

  const topicCount = new Set(
    files
      .map((f) => relativePath(f).split("/").filter(Boolean)[0])
      .filter(Boolean)
  ).size;

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
        takeFiles(Array.from(e.dataTransfer.files ?? []));
      }}
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        // @ts-expect-error — non-standard directory picker (Chromium / Safari)
        webkitdirectory=""
        disabled={disabled}
        className="sr-only"
        onChange={(e) => {
          takeFiles(Array.from(e.target.files ?? []));
          e.target.value = "";
        }}
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) inputRef.current?.click();
        }}
        className={clsx(
          "file-upload-zone w-full group",
          dragOver && !disabled && "file-upload-zone-active",
          disabled && "pointer-events-none opacity-80"
        )}
      >
        <span className="file-upload-icon">
          <FolderUp className="w-5 h-5" />
        </span>
        <span className="flex flex-col items-start min-w-0 text-left">
          <span className="font-medium text-sm text-[var(--text-primary)]">
            {files.length > 0
              ? `${files.length} file${files.length === 1 ? "" : "s"} selected`
              : label}
          </span>
          <span className="text-xs text-[var(--text-muted)] truncate max-w-full">
            {files.length > 0
              ? `${topicCount} folder${topicCount === 1 ? "" : "s"} · click to add more`
              : dragOver
                ? "Drop folders to import"
                : "Select one or more folders — each folder becomes a topic"}
          </span>
        </span>
      </button>
    </div>
  );
}
