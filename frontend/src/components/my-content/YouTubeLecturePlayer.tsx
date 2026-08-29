"use client";

import { useEffect, useRef, type MutableRefObject } from "react";
import { loadYoutubeIframeApi, type YtPlayer } from "@/lib/youtubeIframeApi";

const SPEEDS = [1, 1.25, 1.5, 1.75, 2] as const;

type YouTubeLecturePlayerProps = {
  videoId: string;
  title: string;
  initialSeconds: number;
  watchUrl: string;
  currentLabel: string;
  speed: number;
  onSpeedChange: (rate: number) => void;
  onTime: (seconds: number, duration: number) => void;
  onStamp: () => void;
  playerRef: MutableRefObject<YtPlayer | null>;
};

export function YouTubeLecturePlayer({
  videoId,
  title,
  initialSeconds,
  watchUrl,
  currentLabel,
  speed,
  onSpeedChange,
  onTime,
  onStamp,
  playerRef,
}: YouTubeLecturePlayerProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const onTimeRef = useRef(onTime);
  onTimeRef.current = onTime;
  const initialRef = useRef(initialSeconds);
  const speedRef = useRef(speed);
  initialRef.current = initialSeconds;
  speedRef.current = speed;

  useEffect(() => {
    let cancelled = false;
    let timer = 0;
    let player: YtPlayer | null = null;
    const host = hostRef.current;
    if (!host) return;

    void loadYoutubeIframeApi().then(() => {
      if (cancelled || !window.YT?.Player || !hostRef.current) return;
      hostRef.current.replaceChildren();
      const mount = document.createElement("div");
      hostRef.current.appendChild(mount);
      player = new window.YT.Player(mount, {
        videoId,
        host: "https://www.youtube-nocookie.com",
        playerVars: {
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (e) => {
            playerRef.current = e.target;
            const startAt = initialRef.current;
            if (startAt > 1) {
              e.target.seekTo(startAt, true);
            }
            try {
              e.target.setPlaybackRate(speedRef.current);
            } catch {
              /* rate not available yet */
            }
            onTimeRef.current(
              e.target.getCurrentTime() || 0,
              e.target.getDuration() || 0
            );
          },
          onStateChange: (e) => {
            onTimeRef.current(
              e.target.getCurrentTime() || 0,
              e.target.getDuration() || 0
            );
          },
        },
      });
      playerRef.current = player;
      timer = window.setInterval(() => {
        const current = playerRef.current;
        if (!current) return;
        try {
          onTimeRef.current(
            current.getCurrentTime() || 0,
            current.getDuration() || 0
          );
        } catch {
          /* player tearing down */
        }
      }, 1000);
    });

    return () => {
      cancelled = true;
      if (timer) window.clearInterval(timer);
      try {
        player?.destroy();
      } catch {
        /* ignore */
      }
      playerRef.current = null;
    };
  }, [videoId, playerRef]);

  return (
    <div className="shrink-0 border-b border-[var(--border)] bg-[var(--bg-primary)]">
      <div className="max-w-4xl mx-auto w-full px-4 pt-3 pb-2 space-y-2">
        <div className="relative w-full aspect-video overflow-hidden rounded-[10px] bg-black">
          <div ref={hostRef} className="absolute inset-0" title={title} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs tabular-nums text-[var(--text-secondary)] min-w-[3.5rem]">
            {currentLabel}
          </span>
          <div className="flex items-center gap-1">
            {SPEEDS.map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => {
                  onSpeedChange(rate);
                  try {
                    playerRef.current?.setPlaybackRate(rate);
                  } catch {
                    /* ignore */
                  }
                }}
                className={`px-1.5 py-0.5 rounded-md text-[11px] border ${
                  speed === rate
                    ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--accent-light)]"
                    : "border-[var(--border)] text-[var(--text-muted)]"
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onStamp}
            className="px-2 py-0.5 rounded-md text-[11px] border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            Stamp {currentLabel}
          </button>
          <a
            href={watchUrl}
            target="_blank"
            rel="noreferrer"
            className="ml-auto text-[11px] text-[var(--accent)] hover:underline"
          >
            Open on YouTube
          </a>
        </div>
        <p className="text-[11px] text-[var(--text-muted)]">
          Stamp inserts the time into notes below. Split a PDF or notebook beside
          this lecture from the library.
        </p>
      </div>
    </div>
  );
}
