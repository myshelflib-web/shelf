"use client";

import { useState } from "react";
import {
  Download,
  Ellipsis,
  Pencil,
  Pin,
  PinOff,
  Trash2,
} from "lucide-react";
import { PhoneBottomSheet } from "@/components/PhoneBottomSheet";

/** Phone-only overflow for Study AI thread actions (desktop keeps the icon row). */
export function StudyAiPhoneThreadMenu({
  canExport,
  exportingChat,
  onExport,
  activeId,
  activePinned,
  onTogglePin,
  onRename,
  onDelete,
}: {
  canExport: boolean;
  exportingChat: boolean;
  onExport: () => void;
  activeId: string | null;
  activePinned: boolean;
  onTogglePin: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <div className="study-ai-phone-thread-actions ml-auto">
      <button
        type="button"
        className="phone-hdr-icon-btn"
        aria-label="Chat actions"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Ellipsis className="h-5 w-5" aria-hidden />
      </button>
      <PhoneBottomSheet
        open={open}
        onClose={close}
        title="Chat actions"
      >
        <div className="flex flex-col gap-1 px-2 pb-2">
          <button
            type="button"
            disabled={!canExport || exportingChat}
            onClick={() => {
              close();
              onExport();
            }}
            className="flex items-center gap-3 rounded-[10px] px-3 py-3 text-[15px] font-medium text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] disabled:opacity-50"
          >
            <Download className="h-[18px] w-[18px]" aria-hidden />
            {exportingChat ? "Exporting…" : "Download"}
          </button>
          {activeId ? (
            <>
              <button
                type="button"
                onClick={() => {
                  close();
                  onTogglePin();
                }}
                className="flex items-center gap-3 rounded-[10px] px-3 py-3 text-[15px] font-medium text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
              >
                {activePinned ? (
                  <PinOff className="h-[18px] w-[18px]" aria-hidden />
                ) : (
                  <Pin className="h-[18px] w-[18px]" aria-hidden />
                )}
                {activePinned ? "Unpin" : "Pin"}
              </button>
              <button
                type="button"
                onClick={() => {
                  close();
                  onRename();
                }}
                className="flex items-center gap-3 rounded-[10px] px-3 py-3 text-[15px] font-medium text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
              >
                <Pencil className="h-[18px] w-[18px]" aria-hidden />
                Rename
              </button>
              <button
                type="button"
                onClick={() => {
                  close();
                  onDelete();
                }}
                className="flex items-center gap-3 rounded-[10px] px-3 py-3 text-[15px] font-medium text-red-400 hover:bg-[var(--bg-secondary)]"
              >
                <Trash2 className="h-[18px] w-[18px]" aria-hidden />
                Delete
              </button>
            </>
          ) : null}
        </div>
      </PhoneBottomSheet>
    </div>
  );
}
