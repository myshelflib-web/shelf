"use client";

import { Maximize2, Minimize2 } from "lucide-react";
import { withShortcut } from "@/lib/hotkeys";

interface FullscreenButtonProps {
  isFullscreen: boolean;
  onToggle: () => void;
  className?: string;
}

export function FullscreenButton({
  isFullscreen,
  onToggle,
  className = "p-2 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)]",
}: FullscreenButtonProps) {
  return (
    <button
      type="button"
      className={className}
      title={
        isFullscreen
          ? "Exit fullscreen (Esc)"
          : withShortcut("Enter fullscreen — expand this document", "f")
      }
      aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
      onClick={() => void onToggle()}
    >
      {isFullscreen ? (
        <Minimize2 className="w-4 h-4" />
      ) : (
        <Maximize2 className="w-4 h-4" />
      )}
    </button>
  );
}
