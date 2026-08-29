"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/hooks/useAuth";
import { useHotkey } from "@/hooks/useHotkeys";
import { useCompactPortrait } from "@/hooks/useCompactPortrait";
import {
  SHELF_FOCUS_NOTEBOOK,
  SHELF_QUIZ_STARTED,
  isQuizTaking,
  type FocusNotebookDetail,
} from "@/lib/shelfEvents";
import { SpotifyDockPanel } from "@/components/my-content/reader/SpotifyDockPanel";
import { TelegramDockPanel } from "@/components/my-content/reader/TelegramDockPanel";
import { AnalyticsEvents, track } from "@/lib/analytics";

const STORAGE_KEY = "shelf:focus-media";

type FocusMediaState = {
  spotifyOpen: boolean;
  telegramOpen: boolean;
};

type FocusMediaContextValue = {
  spotifyOpen: boolean;
  telegramOpen: boolean;
  toggleSpotify: () => void;
  toggleTelegram: () => void;
  closeSpotify: () => void;
  closeTelegram: () => void;
  openSpotify: () => void;
  openTelegram: () => void;
};

const FocusMediaContext = createContext<FocusMediaContextValue | null>(null);

function loadState(): FocusMediaState {
  if (typeof window === "undefined") {
    return { spotifyOpen: false, telegramOpen: false };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { spotifyOpen: false, telegramOpen: false };
    const parsed = JSON.parse(raw) as Partial<FocusMediaState>;
    return {
      spotifyOpen: Boolean(parsed.spotifyOpen),
      telegramOpen: Boolean(parsed.telegramOpen),
    };
  } catch {
    return { spotifyOpen: false, telegramOpen: false };
  }
}

export function FocusMediaProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [spotifyOpen, setSpotifyOpen] = useState(false);
  const [telegramOpen, setTelegramOpen] = useState(false);
  const [notebook, setNotebook] = useState<{
    id: string;
    name: string;
  } | null>(null);

  useEffect(() => {
    const stored = loadState();
    setSpotifyOpen(stored.spotifyOpen);
    setTelegramOpen(stored.telegramOpen);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ spotifyOpen, telegramOpen } satisfies FocusMediaState)
      );
    } catch {
      /* ignore quota */
    }
  }, [spotifyOpen, telegramOpen]);

  useEffect(() => {
    const onNotebook = (e: Event) => {
      const detail = (e as CustomEvent<FocusNotebookDetail>).detail;
      if (detail?.id) setNotebook({ id: detail.id, name: detail.name ?? "" });
      else setNotebook(null);
    };
    window.addEventListener(SHELF_FOCUS_NOTEBOOK, onNotebook);
    return () => window.removeEventListener(SHELF_FOCUS_NOTEBOOK, onNotebook);
  }, []);

  const openSpotify = useCallback(() => {
    setSpotifyOpen(true);
    setTelegramOpen(false);
    track(AnalyticsEvents.spotifyDockOpened);
  }, []);
  const closeSpotify = useCallback(() => setSpotifyOpen(false), []);
  const openTelegram = useCallback(() => {
    setTelegramOpen(true);
    setSpotifyOpen(false);
  }, []);
  const closeTelegram = useCallback(() => setTelegramOpen(false), []);

  const toggleSpotify = useCallback(() => {
    if (isQuizTaking()) return;
    if (spotifyOpen) closeSpotify();
    else openSpotify();
  }, [spotifyOpen, closeSpotify, openSpotify]);

  const toggleTelegram = useCallback(() => {
    if (isQuizTaking()) return;
    if (telegramOpen) closeTelegram();
    else openTelegram();
  }, [telegramOpen, closeTelegram, openTelegram]);

  useEffect(() => {
    const onQuiz = () => {
      closeSpotify();
      closeTelegram();
    };
    window.addEventListener(SHELF_QUIZ_STARTED, onQuiz);
    return () => window.removeEventListener(SHELF_QUIZ_STARTED, onQuiz);
  }, [closeSpotify, closeTelegram]);

  useHotkey("\\", toggleSpotify, { enabled: Boolean(user) });

  const value = useMemo(
    () => ({
      spotifyOpen,
      telegramOpen,
      toggleSpotify,
      toggleTelegram,
      closeSpotify,
      closeTelegram,
      openSpotify,
      openTelegram,
    }),
    [
      spotifyOpen,
      telegramOpen,
      toggleSpotify,
      toggleTelegram,
      closeSpotify,
      closeTelegram,
      openSpotify,
      openTelegram,
    ]
  );

  return (
    <FocusMediaContext.Provider value={value}>
      {children}
      {user ? (
        <FocusMediaHost
          notebook={notebook}
          spotifyOpen={spotifyOpen}
          telegramOpen={telegramOpen}
          closeSpotify={closeSpotify}
          closeTelegram={closeTelegram}
          openSpotify={openSpotify}
        />
      ) : null}
    </FocusMediaContext.Provider>
  );
}

function FocusMediaHost({
  notebook,
  spotifyOpen,
  telegramOpen,
  closeSpotify,
  closeTelegram,
  openSpotify,
}: {
  notebook: { id: string; name: string } | null;
  spotifyOpen: boolean;
  telegramOpen: boolean;
  closeSpotify: () => void;
  closeTelegram: () => void;
  openSpotify: () => void;
}) {
  const compact = useCompactPortrait();
  const panelOpen = spotifyOpen || telegramOpen;

  return (
    <div
      className={
        panelOpen
          ? compact
            ? "fixed inset-x-0 bottom-0 z-[45] h-[min(42vh,320px)] overflow-hidden border-t border-[var(--border)] bg-[var(--bg-elevated)] shadow-2xl"
            : "fixed top-12 right-0 z-[45] w-[min(360px,42vw)] h-[calc(100dvh-3rem)] overflow-hidden"
          : "contents"
      }
    >
      <SpotifyDockPanel
        notebookId={notebook?.id}
        notebookName={notebook?.name}
        minimized={!spotifyOpen}
        onMinimize={closeSpotify}
        onExpand={openSpotify}
      />
      <TelegramDockPanel
        minimized={!telegramOpen}
        onMinimize={closeTelegram}
      />
    </div>
  );
}

export function useFocusMedia(): FocusMediaContextValue {
  const ctx = useContext(FocusMediaContext);
  if (!ctx) {
    throw new Error("useFocusMedia must be used within FocusMediaProvider");
  }
  return ctx;
}
