"use client";

import Link from "next/link";
import clsx from "clsx";
import { Crop, Share2, Sparkles, Star, Trash2 } from "lucide-react";
import type { PageAccessInfo } from "@/types";
import { FullscreenButton } from "@/components/FullscreenButton";
import { withShortcut } from "@/lib/hotkeys";

export function AccessDeniedState() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-3">
      <div className="w-12 h-12 rounded-2xl bg-red-500/15 text-red-400 flex items-center justify-center text-lg font-bold">
        !
      </div>
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">
        You no longer have access
      </h2>
      <p className="text-sm text-[var(--text-muted)] max-w-md">
        The owner removed your permission to this file. Independent copies in
        your library are unaffected.
      </p>
      <Link
        href="/my-content"
        className="mt-2 text-sm font-semibold text-[var(--accent)] hover:underline"
      >
        Back to Library
      </Link>
    </div>
  );
}

export function SharedByBanner({
  access,
  onSaveCopy,
}: {
  access: PageAccessInfo;
  onSaveCopy: () => void;
}) {
  return (
    <div className="shrink-0 px-4 py-2 border-b border-[var(--border)] bg-[var(--accent-light)]/40 flex items-center gap-2 text-xs text-[var(--accent)]">
      <span className="flex-1 min-w-0">
        <strong className="text-[var(--text-primary)]">
          Shared by {access.owner.name}
        </strong>
        {" · "}
        {access.canAnnotate
          ? "You can edit annotations on this file."
          : "You can view this file."}
      </span>
      <button
        type="button"
        className="shrink-0 h-7 px-2.5 rounded-lg border border-[var(--accent)]/40 bg-[var(--bg-elevated)] text-[10px] font-semibold"
        onClick={onSaveCopy}
      >
        Save a copy
      </button>
    </div>
  );
}

export function ShareChromeButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-[var(--border)] text-[11px] font-semibold text-[var(--text-secondary)] hover:bg-[var(--accent-light)] hover:text-[var(--accent)] hover:border-[var(--accent)]/40"
      title="Share this page"
      aria-label="Share"
      onClick={onClick}
    >
      <Share2 className="w-3.5 h-3.5" />
      Share
    </button>
  );
}

export function StarChromeButton({
  starred,
  onClick,
}: {
  starred: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "p-2 rounded-lg",
        starred
          ? "text-amber-400"
          : "text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
      )}
      title={withShortcut(starred ? "Remove star" : "Star this page", "*")}
      aria-label={starred ? "Remove star" : "Star this page"}
      aria-pressed={starred}
    >
      <Star className={clsx("w-4 h-4", starred && "fill-amber-400")} />
    </button>
  );
}

export function DocumentChromeActions({
  isFullscreen,
  fsAiOpen,
  onToggleFsAi,
  onToggleFullscreen,
  showClip,
  htmlClip,
  onToggleClip,
  showShare,
  onShare,
  starred,
  onToggleStar,
  showDelete,
  onDelete,
}: {
  isFullscreen: boolean;
  fsAiOpen: boolean;
  onToggleFsAi: () => void;
  onToggleFullscreen: () => void;
  showClip: boolean;
  htmlClip: boolean;
  onToggleClip: () => void;
  showShare: boolean;
  onShare: () => void;
  starred: boolean;
  onToggleStar: () => void;
  showDelete: boolean;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-end gap-0.5 shrink-0 justify-self-end">
      {isFullscreen && (
        <button
          type="button"
          className={`p-2 rounded-lg ${
            fsAiOpen
              ? "bg-[var(--accent-light)] text-[var(--accent)]"
              : "text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
          }`}
          title={
            fsAiOpen
              ? "Hide Study AI"
              : "Open Study AI beside this document"
          }
          aria-label={fsAiOpen ? "Hide Study AI" : "Show Study AI"}
          aria-pressed={fsAiOpen}
          onClick={onToggleFsAi}
        >
          <Sparkles className="w-4 h-4" />
        </button>
      )}
      <FullscreenButton
        isFullscreen={isFullscreen}
        onToggle={onToggleFullscreen}
      />
      {showClip && (
        <button
          type="button"
          className={`p-2 rounded-lg ${htmlClip ? "bg-[var(--accent-light)] text-[var(--accent)]" : "text-[var(--text-muted)] hover:bg-[var(--bg-secondary)]"}`}
          title="Clip a region of the page as an image"
          aria-label="Clip region"
          onClick={onToggleClip}
        >
          <Crop className="w-4 h-4" />
        </button>
      )}
      {showShare && <ShareChromeButton onClick={onShare} />}
      <StarChromeButton starred={starred} onClick={onToggleStar} />
      {showDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="p-2 rounded-lg hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-500"
          title="Delete this page permanently"
          aria-label="Delete page"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
