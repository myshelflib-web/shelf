"use client";

import { useEffect, useRef, type MutableRefObject } from "react";
import { loadYoutubeIframeApi, type YtPlayer } from "@/lib/youtubeIframeApi";

const SPEEDS = [1, 1.25, 1.5, 1.75, 2] as const;

function pauseQuietly(player: YtPlayer | null | undefined) {
  try {
    player?.pauseVideo();
  } catch {
    /* player tearing down */
  }
}

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
  stampEnabled?: boolean;
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
  stampEnabled = true,
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
      mount.style.width = "100%";
      mount.style.height = "100%";
      hostRef.current.appendChild(mount);
      const startAt = Math.max(0, Math.floor(initialRef.current));
      player = new window.YT.Player(mount, {
        videoId,
        width: "100%",
        height: "100%",
        host: "https://www.youtube-nocookie.com",
        playerVars: {
          autoplay: 0,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          origin: window.location.origin,
          ...(startAt > 1 ? { start: startAt } : {}),
        },
        events: {
          onReady: (e) => {
            playerRef.current = e.target;
            // Cue at resume position without starting playback.
            pauseQuietly(e.target);
            try {
              e.target.setPlaybackRate(speedRef.current);
            } catch {
              /* rate not available yet */
            }
            onTimeRef.current(
              e.target.getCurrentTime() || startAt,
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
    <div className="flex-1 flex flex-col min-h-0 min-w-0 bg-black">
      <div className="relative flex-1 min-h-0 w-full overflow-hidden bg-black">
        <div
          ref={hostRef}
          className="absolute inset-0 [&_iframe]:absolute [&_iframe]:inset-0 [&_iframe]:h-full [&_iframe]:w-full"
          title={title}
        />
      </div>
      <div className="shrink-0 flex flex-wrap items-center gap-2 px-3 py-2 bg-[var(--bg-primary)] border-t border-[var(--border)]">
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
        {stampEnabled ? (
          <button
            type="button"
            onClick={onStamp}
            className="px-2 py-0.5 rounded-md text-[11px] border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
            title="Insert timestamp into notes"
          >
            Stamp {currentLabel}
          </button>
        ) : null}
        <a
          href={watchUrl}
          target="_blank"
          rel="noreferrer"
          className="ml-auto text-[11px] text-[var(--accent)] hover:underline"
        >
          Open on YouTube
        </a>
      </div>
    </div>
  );
}
