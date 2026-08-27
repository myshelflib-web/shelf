"use client";

import type { DragEvent, ReactNode } from "react";

interface MyContentAddDropLayerProps {
  children: ReactNode;
  fileDragDepth: number;
  inert: boolean;
  onDragEnter: (e: DragEvent) => void;
  onDragLeave: (e: DragEvent) => void;
  onDragOver: (e: DragEvent) => void;
  onDrop: (e: DragEvent) => void;
}

export function MyContentAddDropLayer({
  children,
  fileDragDepth,
  inert,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop,
}: MyContentAddDropLayerProps) {
  return (
    <div
      className="relative h-full min-h-0"
      inert={inert ? true : undefined}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {children}
      {fileDragDepth > 0 && (
        <div
          className="pointer-events-none absolute inset-0 z-[60] flex items-center justify-center bg-[var(--bg-primary)]/75 backdrop-blur-[1px]"
          aria-hidden
        >
          <div className="rounded-2xl border-2 border-dashed border-[var(--accent)] bg-[var(--bg-elevated)] px-8 py-6 text-center shadow-xl">
            <p className="text-base font-semibold text-[var(--text-primary)]">
              Drop to upload
            </p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              PDF, TXT, MD, DOCX — or drop folders to bulk import
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
