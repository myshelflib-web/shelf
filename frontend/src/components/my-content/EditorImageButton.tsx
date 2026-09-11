"use client";

import { useRef } from "react";
import { ImagePlus } from "lucide-react";
import { ToolBtn } from "./EditorToolbarChrome";

/** Toolbar control that opens a local image file picker. */
export function EditorImageButton({
  compact = false,
  busy = false,
  onFile,
}: {
  compact?: boolean;
  busy?: boolean;
  onFile: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const icon = compact ? "w-3.5 h-3.5" : "w-[17px] h-[17px]";

  return (
    <>
      <ToolBtn
        compact={compact}
        label="Insert image (upload or paste)"
        disabled={busy}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
      >
        <ImagePlus className={icon} />
      </ToolBtn>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/bmp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) onFile(file);
        }}
      />
    </>
  );
}
