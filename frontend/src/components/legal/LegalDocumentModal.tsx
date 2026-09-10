"use client";

import { useEffect } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { getLegalDocument } from "@/lib/legal";
import { LegalDocumentBody } from "./LegalDocumentBody";

export function LegalDocumentModal({
  docId,
  onClose,
}: {
  docId: "terms" | "privacy";
  onClose: () => void;
}) {
  const doc = getLegalDocument(docId);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-doc-title"
        className="w-full max-w-2xl max-h-[min(85vh,720px)] flex flex-col rounded-[10px] border border-[var(--border)] bg-[var(--bg-elevated)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 flex items-start justify-between gap-3 px-4 sm:px-5 py-3.5 border-b border-[var(--border)]">
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--accent)]">
              Legal
            </p>
            <h2
              id="legal-doc-title"
              className="text-lg font-semibold text-[var(--text-primary)] tracking-tight"
            >
              {doc.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-5 py-4">
          <p className="mb-4 text-[11px] leading-relaxed rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-2 text-[var(--text-secondary)]">
            Interim document pending attorney review. Not legal advice.
          </p>
          <LegalDocumentBody doc={doc} />
        </div>
        <div className="shrink-0 flex items-center justify-between gap-3 px-4 sm:px-5 py-3 border-t border-[var(--border)]">
          <Link
            href={doc.path}
            className="text-xs text-[var(--accent)] hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Open full page
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="h-8 px-3.5 rounded-full text-xs font-semibold bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
