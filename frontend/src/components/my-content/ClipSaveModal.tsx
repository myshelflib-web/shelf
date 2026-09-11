"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Download, X } from "lucide-react";

interface ClipSaveModalProps {
  imageDataUrl: string;
  onClose: () => void;
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

async function copyDataUrlToClipboard(dataUrl: string): Promise<void> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
    await navigator.clipboard.write([
      new ClipboardItem({ [blob.type || "image/png"]: blob }),
    ]);
    return;
  }
  throw new Error("Clipboard image copy is not supported in this browser.");
}

/** Snapshot preview with download + copy only (no library save). */
export function ClipSaveModal({ imageDataUrl, onClose }: ClipSaveModalProps) {
  const [busy, setBusy] = useState<"download" | "copy" | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(t);
  }, [copied]);

  const download = () => {
    setError("");
    setBusy("download");
    try {
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      downloadDataUrl(imageDataUrl, `shelf-clip-${stamp}.png`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not download clip");
    } finally {
      setBusy(null);
    }
  };

  const copy = async () => {
    setError("");
    setBusy("copy");
    try {
      await copyDataUrlToClipboard(imageDataUrl);
      setCopied(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not copy clip");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-labelledby="clip-modal-title"
        className="relative w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-2xl p-5"
      >
        <div className="flex items-center justify-between mb-3">
          <h2 id="clip-modal-title" className="font-semibold">
            Clip
          </h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
        {/* Clip is a data URL; next/image is not suitable here. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageDataUrl}
          alt="Clip preview"
          className="w-full max-h-48 object-contain rounded-lg border border-[var(--border)] mb-4 bg-[var(--bg-secondary)]"
        />
        {error ? <p className="text-xs text-red-400 mb-3">{error}</p> : null}
        <div className="flex gap-2">
          <button
            type="button"
            disabled={busy !== null}
            className="btn-primary flex-1 inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
            onClick={download}
          >
            <Download className="w-4 h-4" />
            {busy === "download" ? "Downloading…" : "Download"}
          </button>
          <button
            type="button"
            disabled={busy !== null}
            className="btn-secondary flex-1 inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
            onClick={() => void copy()}
          >
            {copied ? (
              <Check className="w-4 h-4 text-[var(--accent)]" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            {busy === "copy" ? "Copying…" : copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>
    </div>
  );
}
