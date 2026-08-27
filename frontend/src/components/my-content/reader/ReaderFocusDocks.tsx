"use client";

import { withShortcut } from "@/lib/hotkeys";
import { SpotifyDockPanel, SpotifyToolbarIcon } from "./SpotifyDockPanel";
import { TelegramDockPanel, TelegramToolbarIcon } from "./TelegramDockPanel";

/** Spotify + Telegram toolbar icons (reader chrome). */
export function ReaderFocusToolbarButtons({
  spotifyCollapsed,
  telegramCollapsed,
  telegramLinked,
  onToggleSpotify,
  onToggleTelegram,
}: {
  spotifyCollapsed: boolean;
  telegramCollapsed: boolean;
  telegramLinked?: boolean;
  onToggleSpotify: () => void;
  onToggleTelegram: () => void;
}) {
  return (
    <>
      <button
        type="button"
        className={`inline-flex size-8 items-center justify-center rounded-md hover:bg-[var(--bg-elevated)] ${
          spotifyCollapsed
            ? "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            : "text-[#1DB954] bg-[var(--bg-elevated)]"
        }`}
        title={
          spotifyCollapsed
            ? withShortcut("Show Spotify focus audio", "\\")
            : withShortcut("Hide Spotify — audio keeps playing", "\\")
        }
        aria-label={spotifyCollapsed ? "Show Spotify" : "Hide Spotify"}
        onClick={onToggleSpotify}
      >
        <SpotifyToolbarIcon className="block size-4 shrink-0" />
      </button>

      <button
        type="button"
        className={`inline-flex size-8 items-center justify-center rounded-md hover:bg-[var(--bg-elevated)] ${
          telegramCollapsed
            ? "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            : "text-[var(--accent)] bg-[var(--bg-elevated)]"
        }`}
        title={
          telegramCollapsed
            ? telegramLinked
              ? "Show Telegram — connected"
              : "Connect Telegram — save PDFs from chats"
            : "Hide Telegram panel"
        }
        aria-label={
          telegramCollapsed
            ? telegramLinked
              ? "Show Telegram (connected)"
              : "Connect Telegram"
            : "Hide Telegram"
        }
        onClick={onToggleTelegram}
      >
        <TelegramToolbarIcon
          linked={telegramLinked}
          className="block size-4 shrink-0"
        />
      </button>
    </>
  );
}

/** Side/bottom slot for Spotify or Telegram focus dock (mutually exclusive). */
export function ReaderFocusDockSlot({
  layoutCompact,
  notebookId,
  notebookName,
  spotifyCollapsed,
  telegramCollapsed,
  onSpotifyMinimize,
  onSpotifyExpand,
  onTelegramMinimize,
  onTelegramExpand,
}: {
  layoutCompact: boolean;
  notebookId?: string | null;
  notebookName?: string | null;
  spotifyCollapsed: boolean;
  telegramCollapsed: boolean;
  onSpotifyMinimize: () => void;
  onSpotifyExpand: () => void;
  onTelegramMinimize: () => void;
  onTelegramExpand: () => void;
}) {
  const bothCollapsed = spotifyCollapsed && telegramCollapsed;

  return (
    <div
      className={
        bothCollapsed
          ? "contents"
          : layoutCompact
            ? "fixed inset-x-0 bottom-0 z-[55] h-[min(42vh,320px)] shrink-0 overflow-hidden border-t border-[var(--border)] bg-[var(--bg-elevated)] shadow-2xl"
            : "w-[min(360px,42vw)] shrink-0 h-full min-h-0 overflow-hidden"
      }
    >
      <SpotifyDockPanel
        notebookId={notebookId}
        notebookName={notebookName}
        minimized={spotifyCollapsed}
        onMinimize={onSpotifyMinimize}
        onExpand={onSpotifyExpand}
      />
      <TelegramDockPanel
        minimized={telegramCollapsed}
        onMinimize={onTelegramMinimize}
        onExpand={onTelegramExpand}
      />
    </div>
  );
}
