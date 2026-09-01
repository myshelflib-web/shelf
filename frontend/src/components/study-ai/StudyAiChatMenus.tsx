"use client";

import type { RefObject } from "react";
import { Library, Pencil, Trash2, Upload, X } from "lucide-react";
import type { PopoverKind } from "@/lib/studyAiWorkspaceUtils";

export function StudyAiAttachMenu({
  menuRef,
  open,
  onClose,
  onFromLibrary,
  onUpload,
}: {
  menuRef: RefObject<HTMLDivElement | null>;
  open: boolean;
  onClose: () => void;
  onFromLibrary: () => void;
  onUpload: () => void;
}) {
  return (
    <div
      ref={menuRef}
      className={`study-ai-popover ${open ? "open" : ""}`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="study-ai-popover-label">Attach to chat</div>
      <button
        type="button"
        onClick={() => {
          onClose();
          onFromLibrary();
        }}
      >
        <span className="study-ai-popicon">
          <Library className="w-3.5 h-3.5" />
        </span>
        <span className="study-ai-popcopy">
          <strong>From Library</strong>
          <span>Choose an existing file, folder, or nested folder</span>
        </span>
      </button>
      <button
        type="button"
        onClick={() => {
          onClose();
          onUpload();
        }}
      >
        <span className="study-ai-popicon">
          <Upload className="w-3.5 h-3.5" />
        </span>
        <span className="study-ai-popcopy">
          <strong>Upload from device</strong>
          <span>PDF, DOCX, image, TXT and more</span>
        </span>
      </button>
    </div>
  );
}

export function StudyAiChatMenu({
  menuRef,
  open,
  onRename,
  onDelete,
}: {
  menuRef: RefObject<HTMLDivElement | null>;
  open: boolean;
  onRename: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      ref={menuRef}
      className={`study-ai-popover ${open ? "open" : ""}`}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <button type="button" onClick={onRename}>
        <span className="study-ai-popicon">
          <Pencil className="w-3.5 h-3.5" />
        </span>
        <span className="study-ai-popcopy">
          <strong>Rename</strong>
        </span>
      </button>
      <div className="study-ai-pop-divider" />
      <button type="button" className="danger" onClick={onDelete}>
        <span className="study-ai-popicon">
          <Trash2 className="w-3.5 h-3.5" />
        </span>
        <span className="study-ai-popcopy">
          <strong>Delete</strong>
        </span>
      </button>
    </div>
  );
}

export function StudyAiRenameModal({
  value,
  onChange,
  renaming,
  onClose,
  onSave,
}: {
  value: string;
  onChange: (v: string) => void;
  renaming: boolean;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[75] flex items-center justify-center bg-black/45 p-5"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-start justify-between gap-4">
          <div>
            <div className="text-lg font-bold">Rename chat</div>
            <div className="text-[10.5px] text-[var(--text-muted)] mt-0.5">
              Give this conversation a memorable title.
            </div>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-secondary)]"
          >
            <X className="w-4 h-4 mx-auto" />
          </button>
        </div>
        <div className="px-5 py-4">
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            autoFocus
            className="w-full px-3 py-2 text-sm rounded-[10px] bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--ring)]"
            onKeyDown={(e) => {
              if (e.key === "Enter") onSave();
            }}
          />
        </div>
        <div className="px-5 py-3 border-t border-[var(--border)] flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 text-[10.5px] rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!value.trim() || renaming}
            onClick={onSave}
            className="px-3 py-2 text-[10.5px] font-semibold rounded-lg bg-[var(--accent)] text-white disabled:opacity-50"
          >
            {renaming ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

export type { PopoverKind };
