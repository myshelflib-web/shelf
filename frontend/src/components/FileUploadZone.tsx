"use client";

import { useCallback, useRef, useState } from "react";
import { Upload } from "lucide-react";
import clsx from "clsx";
import type { UploadProgress } from "@/lib/api";

interface FileUploadZoneProps {
  accept?: string;
  file: File | null;
  onChange: (file: File | null) => void;
  label?: string;
  disabled?: boolean;
  progress?: Pick<UploadProgress, "percent" | "phase"> | null;
}

function fileMatchesAccept(file: File, accept: string): boolean {
  if (!accept.trim()) return true;
  const tokens = accept.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
  const name = file.name.toLowerCase();
  const type = (file.type || "").toLowerCase();
  return tokens.some((token) => {
    if (token.startsWith(".")) return name.endsWith(token);
    if (token.endsWith("/*")) return type.startsWith(token.slice(0, -1));
    return type === token;
  });
}

export function FileUploadZone({
  accept = "application/pdf",
  file,
  onChange,
  label = "Choose PDF file",
  disabled = false,
  progress = null,
}: FileUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const takeFile = useCallback(
    (next: File | null) => {
      if (disabled) return;
      if (!next) {
        onChange(null);
        return;
      }
      if (!fileMatchesAccept(next, accept)) return;
      onChange(next);
    },
    [accept, disabled, onChange]
  );

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
        const dropped = e.dataTransfer.files?.[0] ?? null;
        takeFile(dropped);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        disabled={disabled}
        className="sr-only"
        onChange={(e) => takeFile(e.target.files?.[0] ?? null)}
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
          <Upload className="w-5 h-5" />
        </span>
        <span className="flex flex-col items-start min-w-0 text-left">
          <span className="font-medium text-sm text-[var(--text-primary)]">
            {file ? file.name : label}
          </span>
          <span className="text-xs text-[var(--text-muted)] truncate max-w-full">
            {progress
              ? progress.phase === "compressing"
                ? "Compressing before upload…"
                : progress.percent >= 100
                  ? "Upload complete — finishing up"
                  : `Uploading ${progress.percent}%`
              : file
                ? `${(file.size / 1024 / 1024).toFixed(2)} MB · click or drop to change`
                : dragOver
                  ? "Drop file to upload"
                  : "Drag & drop or click · PDF, TXT, MD, DOCX"}
          </span>
        </span>
      </button>
    </div>
  );
}
