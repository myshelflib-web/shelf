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
      <label className="flex items-start gap-2 text-xs text-[var(--text-secondary)] leading-relaxed">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          required
          className="mt-0.5 rounded border-[var(--border)]"
        />
        <span>
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
