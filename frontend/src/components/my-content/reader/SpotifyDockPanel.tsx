"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink, ListMusic, Music2, PanelRightOpen, X } from "lucide-react";
import {
  FOCUS_PLAYLISTS,
  parseSpotifyInput,
  SpotifyEmbedTarget,
  spotifyEmbedHeight,
} from "@/lib/spotifyEmbed";
import {
  getRecentSpotifyUrls,
  getNotebookSpotifyUrl,
  resolveSpotifyUrl,
  setNotebookSpotifyUrl,
  setSpotifyUrl,
} from "@/lib/spotifyPrefs";

function SpotifyMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden
      fill="currentColor"
    >
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.198-.9-.54-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.302 1.021zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  );
}

/** Stable iframe — parent must not remount this on minimize. */
function SpotifyEmbedFrame({ target }: { target: SpotifyEmbedTarget }) {
  const height = spotifyEmbedHeight(target.kind);
  return (
    <iframe
      title={
        target.kind === "playlist"
          ? "Spotify playlist player"
          : "Spotify player"
      }
      src={target.embedUrl}
      width="100%"
      height={height}
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      loading="eager"
      className="border-0 block w-full"
    />
  );
}

export function SpotifyDockPanel({
  notebookId,
  notebookName,
  minimized = false,
  onMinimize,
  onExpand,
  onActiveChange,
}: {
  notebookId?: string | null;
  notebookName?: string | null;
  /** Hide chrome; embed stays mounted so audio keeps playing. */
  minimized?: boolean;
  onMinimize: () => void;
  onExpand: () => void;
  onActiveChange?: (hasPlayer: boolean) => void;
}) {
  const [draft, setDraft] = useState("");
  const [activeUrl, setActiveUrl] = useState("");
  const [error, setError] = useState("");
  const [recent, setRecent] = useState<string[]>([]);
  const [asNotebookFocus, setAsNotebookFocus] = useState(false);

  useEffect(() => {
    const initial = resolveSpotifyUrl(notebookId);
    setActiveUrl(initial);
    setDraft(initial);
    setRecent(getRecentSpotifyUrls());
    if (notebookId) {
      setAsNotebookFocus(Boolean(getNotebookSpotifyUrl(notebookId)));
    } else {
      setAsNotebookFocus(false);
    }
  }, [notebookId]);

  const target = useMemo(
    () => (activeUrl ? parseSpotifyInput(activeUrl) : null),
    [activeUrl]
  );

  useEffect(() => {
    onActiveChange?.(Boolean(target));
  }, [target, onActiveChange]);

  const apply = (raw: string, saveAsNotebook: boolean) => {
    const parsed = parseSpotifyInput(raw);
    if (!parsed) {
      setError(
        "Paste a full Spotify link (playlist, track, album, or podcast). Short spotify.link URLs need to be opened once and re-copied as open.spotify.com/…"
      );
      return;
    }
    setError("");
    setActiveUrl(parsed.openUrl);
    setDraft(parsed.openUrl);
    setSpotifyUrl(parsed.openUrl);
    setRecent(getRecentSpotifyUrls());
    if (notebookId && saveAsNotebook) {
      setNotebookSpotifyUrl(notebookId, parsed.openUrl);
      setAsNotebookFocus(true);
    }
  };

  const clearNotebookFocus = () => {
    if (!notebookId) return;
    setNotebookSpotifyUrl(notebookId, null);
    setAsNotebookFocus(false);
  };

  const stopPlayer = () => {
    setActiveUrl("");
    setDraft("");
    onMinimize();
  };

  const focusLabel =
    target?.kind === "playlist"
      ? FOCUS_PLAYLISTS.find((f) => parseSpotifyInput(f.url)?.id === target.id)
          ?.label
      : undefined;

  // Nothing to keep alive and panel is hidden — render nothing (no layout).
  if (minimized && !target) return null;

  return (
    <>
      {minimized && target ? (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--bg-elevated)]/95 backdrop-blur-md shadow-lg pl-2.5 pr-1.5 py-1.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1DB954]/20 text-[#1DB954] shrink-0">
            <SpotifyMark className="w-3.5 h-3.5" />
          </span>
          <div className="min-w-0 px-1 max-w-[140px]">
            <p className="text-[11px] font-medium text-[var(--text-primary)] truncate leading-tight">
              {focusLabel ?? "Playing"}
            </p>
            <p className="text-[9px] text-[var(--text-muted)] truncate leading-tight">
              Hidden · audio on
            </p>
          </div>
          <button
            type="button"
            onClick={onExpand}
            className="p-1.5 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
            title="Show Spotify panel"
            aria-label="Show Spotify panel"
          >
            <PanelRightOpen className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={stopPlayer}
            className="p-1.5 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
            title="Stop and dismiss"
            aria-label="Stop Spotify"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : null}

      {/*
        Single shell for the embed: when minimized, park off-screen with real
        dimensions (unmount / display:none would stop Spotify audio).
      */}
      <div
        className={
          minimized
            ? "fixed overflow-hidden pointer-events-none"
            : "h-full flex flex-col border-l border-[var(--border)] bg-[var(--bg-elevated)] overflow-hidden"
        }
        style={
          minimized
            ? {
                left: -10000,
                top: 0,
                width: 320,
                height: target ? spotifyEmbedHeight(target.kind) + 80 : 400,
                opacity: 0,
              }
            : undefined
        }
        aria-hidden={minimized || undefined}
      >
        {!minimized ? (
          <div className="flex items-center justify-between gap-3 px-4 pt-3 pb-2 shrink-0 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-2 min-w-0">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1DB954]/15 text-[#1DB954] shrink-0">
                <SpotifyMark className="w-3.5 h-3.5" />
              </span>
              <div className="min-w-0">
                <h2 className="text-[13px] font-semibold text-[var(--text-primary)] leading-tight">
                  Focus audio
                </h2>
                <p className="text-[11px] text-[var(--text-muted)] truncate">
                  Hide keeps playing in the background
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onMinimize}
              className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
              title="Hide panel — audio keeps playing"
              aria-label="Hide Spotify panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : null}

        <div
          className={
            minimized
              ? undefined
              : "flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0"
          }
        >
          {!minimized ? (
            <>
              <p className="text-[11px] leading-relaxed text-[var(--text-muted)]">
                Pick a focus playlist below, or paste any Spotify playlist link.
                Sign in inside the player to play your own playlists — Shelf
                never stores your Spotify password.
              </p>

              <div className="space-y-1.5">
                <p className="text-[11px] font-medium text-[var(--text-secondary)] flex items-center gap-1.5">
                  <ListMusic className="w-3.5 h-3.5" />
                  Play a playlist
                </p>
                <div className="grid grid-cols-1 gap-1.5">
                  {FOCUS_PLAYLISTS.map((pl) => {
                    const active =
                      target?.kind === "playlist" &&
                      parseSpotifyInput(pl.url)?.id === target.id;
                    return (
                      <button
                        key={pl.url}
                        type="button"
                        onClick={() => apply(pl.url, asNotebookFocus)}
                        className={`w-full text-left rounded-lg border px-3 py-2 transition-colors ${
                          active
                            ? "border-[#1DB954]/50 bg-[#1DB954]/10 text-[var(--text-primary)]"
                            : "border-[var(--border)] bg-[var(--bg-primary)] hover:border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        }`}
                      >
                        <span className="block text-[12px] font-medium">
                          {pl.label}
                        </span>
                        <span className="block text-[10px] text-[var(--text-muted)]">
                          {pl.hint}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <form
                className="space-y-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  apply(draft, asNotebookFocus);
                }}
              >
                <label className="block text-[11px] font-medium text-[var(--text-secondary)]">
                  Or paste your playlist / track link
                </label>
                <input
                  type="text"
                  inputMode="url"
                  autoComplete="off"
                  spellCheck={false}
                  value={draft}
                  onChange={(e) => {
                    setDraft(e.target.value);
                    setError("");
                  }}
                  onPaste={(e) => {
                    const text = e.clipboardData.getData("text");
                    if (parseSpotifyInput(text)) {
                      e.preventDefault();
                      setDraft(text.trim());
                      apply(text, asNotebookFocus);
                    }
                  }}
                  placeholder="https://open.spotify.com/playlist/…"
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
                {error ? (
                  <p className="text-[11px] text-red-400">{error}</p>
                ) : null}

                {notebookId ? (
                  <label className="flex items-start gap-2 text-[11px] text-[var(--text-secondary)] cursor-pointer">
                    <input
                      type="checkbox"
                      className="mt-0.5 accent-[#1DB954]"
                      checked={asNotebookFocus}
                      onChange={(e) => {
                        const on = e.target.checked;
                        setAsNotebookFocus(on);
                        if (!on) clearNotebookFocus();
                      }}
                    />
                    <span>
                      Remember as focus playlist for{" "}
                      <span className="text-[var(--text-primary)]">
                        {notebookName ?? "this collection"}
                      </span>
                    </span>
                  </label>
                ) : null}

                <button
                  type="submit"
                  className="w-full rounded-lg bg-[#1DB954]/15 hover:bg-[#1DB954]/25 border border-[#1DB954]/30 px-3 py-2 text-[12px] font-medium text-[#1DB954] transition-colors"
                >
                  Load playlist / track
                </button>
              </form>

              {recent.length > 0 ? (
                <div className="space-y-1.5">
                  <p className="text-[11px] font-medium text-[var(--text-secondary)]">
                    Recent
                  </p>
                  <ul className="space-y-1">
                    {recent.map((url) => {
                      const p = parseSpotifyInput(url);
                      const label = FOCUS_PLAYLISTS.find(
                        (f) => parseSpotifyInput(f.url)?.id === p?.id
                      )?.label;
                      return (
                        <li key={url}>
                          <button
                            type="button"
                            onClick={() => {
                              setDraft(url);
                              apply(url, false);
                            }}
                            className="w-full text-left rounded-md px-2 py-1.5 text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] truncate"
                          >
                            <Music2 className="w-3 h-3 inline-block mr-1.5 opacity-60" />
                            {label
                              ? label
                              : p
                                ? `${p.kind} · ${p.id.slice(0, 8)}…`
                                : url}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}
            </>
          ) : null}

          {target ? (
            <div className={minimized ? undefined : "space-y-2"}>
              {!minimized ? (
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-medium text-[var(--text-secondary)] capitalize">
                    {target.kind === "playlist"
                      ? "Playlist player"
                      : target.kind}
                  </p>
                  <a
                    href={target.openUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-[var(--accent)] hover:underline"
                  >
                    Open in Spotify
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ) : null}
              <div
                className={
                  minimized
                    ? undefined
                    : "rounded-xl overflow-hidden bg-[#121212] border border-[var(--border-subtle)]"
                }
                style={
                  minimized
                    ? undefined
                    : { minHeight: spotifyEmbedHeight(target.kind) }
                }
              >
                <SpotifyEmbedFrame target={target} />
              </div>
              {!minimized ? (
                <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">
                  Hide the panel (×) to keep listening while you read. Use the
                  green Spotify icon or the floating chip to show it again.
                </p>
              ) : null}
            </div>
          ) : !minimized ? (
            <div className="rounded-xl border border-dashed border-[var(--border)] px-4 py-8 text-center">
              <SpotifyMark className="w-8 h-8 mx-auto mb-2 text-[#1DB954]/70" />
              <p className="text-[12px] text-[var(--text-muted)]">
                Choose a focus playlist or paste your own to start listening.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}

export function SpotifyToolbarIcon({ className }: { className?: string }) {
  return <SpotifyMark className={className} />;
}
