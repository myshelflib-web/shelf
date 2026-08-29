"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import { PanelRightClose, PanelRightOpen } from "lucide-react";
import { PersonalContentArea } from "@/components/my-content/PersonalContentArea";
import { YouTubeLecturePlayer } from "@/components/my-content/YouTubeLecturePlayer";
import { api } from "@/lib/api";
import { requireOnline } from "@/lib/offline/notice";
import {
  formatVideoTime,
  prependTimestamp,
  secondsFromTimestampHref,
} from "@/lib/videoNotes";
import { canonicalWatchUrl, parseYoutubeUrl } from "@/lib/youtubeUrl";
import type { YtPlayer } from "@/lib/youtubeIframeApi";
import type { UserContentHighlight } from "@/types";

const NOTES_OPEN_KEY = "shelf:video-notes-open";
const NOTES_WIDTH = 340;

type VideoPageViewProps = {
  pageId: string;
  title: string;
  sourceUrl: string;
  notesHtml: string;
  initialSeconds: number;
  highlights: UserContentHighlight[];
  onHighlightsChange: (highlights: UserContentHighlight[]) => void;
  guestLocked: boolean;
  onGuestLockedClick?: (feature: string) => void;
  onAskSelection: (
    text: string,
    imageBase64?: string,
    attachNote?: (note: string) => Promise<void>
  ) => void;
  clipMode: boolean;
  onClip: (imageDataUrl: string) => void;
  onViewStateChange: (state: { scrollTop: number }) => void;
  onReadProgress: (percent: number) => void;
};

function readNotesOpen(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const raw = localStorage.getItem(NOTES_OPEN_KEY);
    if (raw == null) return true;
    return raw !== "0";
  } catch {
    return true;
  }
}

export function VideoPageView({
  pageId,
  title,
  sourceUrl,
  notesHtml,
  initialSeconds,
  highlights,
  onHighlightsChange,
  guestLocked,
  onGuestLockedClick,
  onAskSelection,
  clipMode,
  onClip,
  onViewStateChange,
  onReadProgress,
}: VideoPageViewProps) {
  const parsed = parseYoutubeUrl(sourceUrl);
  const videoId = parsed?.kind === "video" ? parsed.videoId : "";
  const playlistId = parsed?.kind === "video" ? parsed.playlistId : undefined;
  const watchUrl = videoId
    ? canonicalWatchUrl(videoId, playlistId)
    : sourceUrl;

  const playerRef = useRef<YtPlayer | null>(null);
  const notesRef = useRef(notesHtml);
  const savedRef = useRef(notesHtml);
  const saveTimer = useRef(0);
  const [notesSeed, setNotesSeed] = useState(notesHtml);
  const [notesEpoch, setNotesEpoch] = useState(0);
  const [seconds, setSeconds] = useState(initialSeconds);
  const [speed, setSpeed] = useState(1);
  const [notesOpen, setNotesOpen] = useState(true);
  const onViewRef = useRef(onViewStateChange);
  onViewRef.current = onViewStateChange;
  const onProgressRef = useRef(onReadProgress);
  onProgressRef.current = onReadProgress;

  useEffect(() => {
    setNotesOpen(readNotesOpen());
  }, []);

  useEffect(() => {
    notesRef.current = notesHtml;
    savedRef.current = notesHtml;
    setNotesSeed(notesHtml);
    setNotesEpoch(0);
  }, [pageId, notesHtml]);

  const setNotesOpenPersist = useCallback((open: boolean) => {
    setNotesOpen(open);
    try {
      localStorage.setItem(NOTES_OPEN_KEY, open ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, []);

  const persistNotes = useCallback(
    async (html: string) => {
      if (!html.trim() || html === savedRef.current) return;
      if (!requireOnline("Save notes")) return;
      const { content } = await api.myContent.updateContent(pageId, html);
      savedRef.current = content;
    },
    [pageId]
  );

  const scheduleSave = useCallback(
    (html: string) => {
      notesRef.current = html;
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      saveTimer.current = window.setTimeout(() => {
        void persistNotes(html).catch(() => undefined);
      }, 400);
    },
    [persistNotes]
  );

  useEffect(() => {
    const flush = () => {
      const html = notesRef.current;
      if (!html.trim() || html === savedRef.current) return;
      void api.myContent.updateContent(pageId, html).catch(() => undefined);
    };
    window.addEventListener("beforeunload", flush);
    return () => {
      window.removeEventListener("beforeunload", flush);
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      flush();
    };
  }, [pageId]);

  const onTime = useCallback((current: number, duration: number) => {
    setSeconds(current);
    onViewRef.current({ scrollTop: Math.max(0, Math.round(current)) });
    if (duration > 0) {
      onProgressRef.current(
        Math.min(100, Math.round((current / duration) * 100))
      );
    }
  }, []);

  const onStamp = useCallback(() => {
    if (!notesOpen) setNotesOpenPersist(true);
    const next = prependTimestamp(notesRef.current, seconds);
    notesRef.current = next;
    setNotesSeed(next);
    setNotesEpoch((n) => n + 1);
    scheduleSave(next);
  }, [notesOpen, scheduleSave, seconds, setNotesOpenPersist]);

  const onNotesClick = useCallback((e: MouseEvent<HTMLDivElement>) => {
    const target = (e.target as HTMLElement).closest("a");
    if (!target) return;
    const href = target.getAttribute("href") || "";
    const t = secondsFromTimestampHref(href);
    if (t == null) return;
    e.preventDefault();
    try {
      playerRef.current?.seekTo(t, true);
    } catch {
      /* ignore */
    }
  }, []);

  if (!videoId) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-[var(--text-muted)] px-6 text-center">
        This YouTube link could not be loaded.{" "}
        <a
          href={sourceUrl}
          className="text-[var(--accent)] underline ml-1"
          target="_blank"
          rel="noreferrer"
        >
          Open original
        </a>
      </div>
    );
  }

  return (
    <div className="flex-1 flex min-h-0 min-w-0 overflow-hidden">
      <div className="flex-1 flex flex-col min-h-0 min-w-0 relative">
        <YouTubeLecturePlayer
          videoId={videoId}
          title={title}
          initialSeconds={initialSeconds}
          watchUrl={watchUrl}
          currentLabel={formatVideoTime(seconds)}
          speed={speed}
          onSpeedChange={setSpeed}
          onTime={onTime}
          onStamp={onStamp}
          playerRef={playerRef}
        />
        {!notesOpen ? (
          <button
            type="button"
            onClick={() => setNotesOpenPersist(true)}
            className="absolute top-3 right-3 z-10 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[10px] border border-[var(--border)] bg-[var(--bg-elevated)] text-[11px] text-[var(--text-secondary)] shadow-sm hover:border-[var(--accent)] hover:text-[var(--accent)]"
            title="Show notes"
            aria-label="Show notes"
          >
            <PanelRightOpen className="w-3.5 h-3.5" />
            Notes
          </button>
        ) : null}
      </div>

      {notesOpen ? (
        <aside
          className="shrink-0 h-full flex flex-col border-l border-[var(--border)] bg-[var(--bg-primary)] min-h-0 overflow-hidden"
          style={{ width: NOTES_WIDTH }}
          aria-label="Lecture notes"
        >
          <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-[var(--border)] shrink-0">
            <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
              Notes
            </p>
            <button
              type="button"
              onClick={() => setNotesOpenPersist(false)}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
              title="Hide notes"
              aria-label="Hide notes"
            >
              <PanelRightClose className="w-3.5 h-3.5" />
            </button>
          </div>
          <div
            className="flex-1 min-h-0 overflow-hidden flex flex-col video-notes-pane"
            onClick={onNotesClick}
          >
            <PersonalContentArea
              key={`${pageId}-${notesEpoch}`}
              content={notesSeed}
              userTopicId={pageId}
              highlights={highlights}
              onHighlightsChange={onHighlightsChange}
              guestLocked={guestLocked}
              onGuestLockedClick={onGuestLockedClick}
              onAskSelection={onAskSelection}
              editing
              onContentChange={scheduleSave}
              clipMode={clipMode}
              onClip={onClip}
            />
          </div>
        </aside>
      ) : null}
    </div>
  );
}
