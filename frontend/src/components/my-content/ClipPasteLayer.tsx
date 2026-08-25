"use client";

import { useEffect, useRef } from "react";

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read image"));
    reader.readAsDataURL(file);
  });
}

export function ClipPasteLayer({
  hint,
  onClip,
}: {
  hint: string;
  onClip: (dataUrl: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onPaste = async (e: ClipboardEvent) => {
      const item = [...(e.clipboardData?.items ?? [])].find((i) =>
        i.type.startsWith("image/")
      );
      const file = item?.getAsFile();
      if (!file) return;
      e.preventDefault();
      onClip(await fileToDataUrl(file));
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [onClip]);

  return (
    <div
      className="absolute inset-0 z-20 flex items-center justify-center bg-[var(--bg-primary)]/55 backdrop-blur-[1px]"
      onDragOver={(e) => e.preventDefault()}
      onDrop={async (e) => {
        e.preventDefault();
        const file = [...e.dataTransfer.files].find((f) =>
          f.type.startsWith("image/")
        );
        if (file) onClip(await fileToDataUrl(file));
      }}
    >
      <div className="max-w-sm text-center rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] px-5 py-4 shadow-lg">
        <p className="text-sm text-[var(--text-secondary)] mb-3">{hint}</p>
        <button
          type="button"
          className="chip-btn"
          onClick={() => inputRef.current?.click()}
        >
          Choose image
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file) onClip(await fileToDataUrl(file));
          }}
        />
      </div>
    </div>
  );
}
