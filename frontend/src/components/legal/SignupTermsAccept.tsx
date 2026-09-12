"use client";

import { useState } from "react";
import { LegalDocumentModal } from "./LegalDocumentModal";

export function SignupTermsAccept({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  const [openDoc, setOpenDoc] = useState<"terms" | "privacy" | null>(null);

  return (
    <>
      <label className="flex items-start gap-2.5 text-xs text-[var(--text-secondary)] leading-relaxed cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          required
          className="size-3.5 shrink-0 rounded border-[var(--border)] translate-y-[2px]"
        />
        <span className="min-w-0">
          I have read and agree to Shelf&apos;s{" "}
          <button
            type="button"
            className="text-[var(--accent)] hover:underline font-medium"
            onClick={() => setOpenDoc("terms")}
          >
            Terms of Service
          </button>{" "}
          and{" "}
          <button
            type="button"
            className="text-[var(--accent)] hover:underline font-medium"
            onClick={() => setOpenDoc("privacy")}
          >
            Privacy Policy
          </button>
          , including the{" "}
          <a
            href="/legal/copyright"
            className="text-[var(--accent)] hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            copyright &amp; upload rules
          </a>
          .
        </span>
      </label>
      {openDoc ? (
        <LegalDocumentModal docId={openDoc} onClose={() => setOpenDoc(null)} />
      ) : null}
    </>
  );
}
