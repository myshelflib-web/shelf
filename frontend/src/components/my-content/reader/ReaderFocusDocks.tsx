"use client";

import { withShortcut } from "@/lib/hotkeys";
import { useAuth } from "@/hooks/useAuth";
import { useFocusMedia } from "@/hooks/useFocusMedia";
import { SpotifyToolbarIcon } from "./SpotifyDockPanel";
import { TelegramToolbarIcon } from "./TelegramDockPanel";

/** Spotify + Telegram icons for the app header. */
export function FocusMediaToolbarButtons() {
  const { user } = useAuth();
  const { spotifyOpen, telegramOpen, toggleSpotify, toggleTelegram } =
    useFocusMedia();

  return (
    <>
      <button
        type="button"
        className={`p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors ${
          spotifyOpen
            ? "text-[#1DB954] bg-[var(--bg-secondary)]"
            : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
        }`}
        title={
          spotifyOpen
            ? withShortcut("Hide Spotify — audio keeps playing", "\\")
            : withShortcut("Show Spotify focus audio", "\\")
        }
        aria-label={spotifyOpen ? "Hide Spotify" : "Show Spotify"}
        onClick={toggleSpotify}
      >
        <SpotifyToolbarIcon className="block size-4 shrink-0" />
      </button>

      <button
        type="button"
        className={`p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors ${
          telegramOpen
            ? "text-[var(--accent)] bg-[var(--bg-secondary)]"
            : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
        }`}
        title={
          telegramOpen
            ? "Hide Telegram panel"
            : user?.telegramLinked
              ? "Share a file, chat, or quiz on Telegram"
              : "Connect Telegram — share files, chats, and quizzes"
        }
        aria-label={
          telegramOpen
            ? "Hide Telegram"
            : user?.telegramLinked
              ? "Show Telegram (connected)"
              : "Connect Telegram"
        }
        onClick={toggleTelegram}
      >
        <TelegramToolbarIcon
          linked={user?.telegramLinked}
          className="block size-4 shrink-0"
        />
      </button>
    </>
  );
}
