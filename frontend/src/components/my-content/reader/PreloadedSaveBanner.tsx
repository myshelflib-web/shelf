"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BookmarkPlus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { emitContentChanged } from "@/lib/contentEvents";
import { rememberGuestLearnArticle } from "@/lib/guestLearnResume";
import { PRELOADED_SAVE_PROMPT_EVENT } from "@/lib/preloadedReadOnly";

type SavePhase = "idle" | "saving" | "ready" | "error";
type SaveMode = "copy_admin" | "download_remote" | "link" | "none";

const SAVE_STEPS: Record<string, string> = {
  link: "Adding official link to your library…",
  copy_admin: "Copying to your library…",
  download_remote: "Downloading official document to your library…",
  none: "Saving…",
};

const savePrimaryButtonClass =
  "shrink-0 inline-flex items-center justify-center rounded-full bg-[var(--accent)] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50 whitespace-nowrap";

const saveSecondaryButtonClass =
  "shrink-0 inline-flex items-center justify-center rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] px-3.5 py-1.5 text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors whitespace-nowrap";

function progressForPoll(poll: number, saveMode?: string): number {
  const base = saveMode === "download_remote" ? 15 : 20;
  return Math.min(92, base + poll * 7);
}

/** Personal PDF/HTML copies support highlights; link bookmarks do not. */
function isAnnotatableLibraryCopy(opts: {
  contentType?: string;
  saveMode?: string;
}): boolean {
  if (opts.contentType === "PDF" || opts.contentType === "HTML") return true;
  if (opts.contentType === "LINK") return false;
  return opts.saveMode === "copy_admin" || opts.saveMode === "download_remote";
}

export function PreloadedSaveBanner({
  subjectSlug,
  topicSlug,
  articleSlug,
  pageTitle,
  saveAllowed = true,
  saveReason,
  saveMode = "link",
  onOpen,
}: {
  subjectSlug: string;
  topicSlug: string;
  articleSlug: string;
  pageTitle: string;
  saveAllowed?: boolean;
  saveReason?: string | null;
  saveMode?: SaveMode;
  onOpen: (href: string) => void;
}) {
  const { user } = useAuth();
  const rootRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<SavePhase>("idle");
  const [savedHref, setSavedHref] = useState<string | null>(null);
  const [annotatableCopy, setAnnotatableCopy] = useState(
    () => isAnnotatableLibraryCopy({ saveMode })
  );
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [stepLabel, setStepLabel] = useState("");

  const savedHrefRef = useRef<string | null>(null);
  const phaseRef = useRef<SavePhase>("idle");
  const saveInFlightRef = useRef(false);
  const onOpenRef = useRef(onOpen);
  onOpenRef.current = onOpen;
  savedHrefRef.current = savedHref;
  phaseRef.current = phase;

  const loginHref = `/login?next=${encodeURIComponent(
    `/learn/${subjectSlug}/${topicSlug}/${articleSlug}`
  )}`;

  const guestSaveHint =
    saveMode === "download_remote"
      ? "Sign in to download a personal copy to your library."
      : saveMode === "copy_admin"
        ? "Sign in to save a personal copy you can highlight and annotate."
        : "Sign in to save this official link to your library.";

  const waitForPublished = useCallback(
    async (pageId: string, mode?: string) => {
      for (let i = 0; i < 60; i += 1) {
        setProgress(progressForPoll(i, mode));
        const { page } = await api.myContent.getPageById(pageId);
        if (page.status === "PUBLISHED") {
          setProgress(100);
          return page;
        }
        if (page.status === "FAILED") {
          throw new Error("Could not finish saving this file");
        }
        await new Promise((r) => window.setTimeout(r, 1500));
      }
      throw new Error("Save is taking longer than expected. Try again shortly.");
    },
    []
  );

  const openLibraryCopy = useCallback((href: string) => {
    onOpenRef.current(href);
  }, []);

  const save = useCallback(
    (opts?: { openWhenReady?: boolean }) => {
      if (saveInFlightRef.current || phaseRef.current === "saving" || !saveAllowed) {
        return;
      }
      const openWhenReady = opts?.openWhenReady ?? true;
      saveInFlightRef.current = true;
      setPhase("saving");
      setError("");
      setProgress(8);
      setStepLabel("Starting save…");
      void (async () => {
        try {
          const res = await api.myContent.saveCurriculumArticle({
            subjectSlug,
            topicSlug,
            articleSlug,
          });
          emitContentChanged();
          setSavedHref(res.href);
          savedHrefRef.current = res.href;

          const mode = (res.saveMode ?? saveMode ?? "copy_admin") as SaveMode;
          let publishedType = res.page.contentType as string | undefined;
          setStepLabel(SAVE_STEPS[mode] ?? res.saveReason ?? "Saving…");
          setProgress(mode === "link" ? 100 : 25);

          if (res.alreadySaved || res.status === "PUBLISHED") {
            setPhase("ready");
            phaseRef.current = "ready";
            setProgress(100);
          } else {
            const published = await waitForPublished(res.page.id, mode);
            publishedType = published.contentType ?? publishedType;
            setPhase("ready");
            phaseRef.current = "ready";
          }

          const canAnnotate = isAnnotatableLibraryCopy({
            contentType: publishedType,
            saveMode: mode,
          });
          setAnnotatableCopy(canAnnotate);

          if (openWhenReady && canAnnotate) {
            openLibraryCopy(res.href);
          }
        } catch (err) {
          setPhase("error");
          phaseRef.current = "error";
          setProgress(0);
          setError(err instanceof Error ? err.message : "Could not save");
        } finally {
          saveInFlightRef.current = false;
        }
      })();
    },
    [
      articleSlug,
      openLibraryCopy,
      saveAllowed,
      saveMode,
      subjectSlug,
      topicSlug,
      waitForPublished,
    ]
  );

  const saveRef = useRef(save);
  saveRef.current = save;

  useEffect(() => {
    const onPrompt = () => {
      const href = savedHrefRef.current;
      if (href) {
        openLibraryCopy(href);
        return;
      }
      if (saveAllowed && !saveInFlightRef.current) {
        saveRef.current({ openWhenReady: true });
        return;
      }
      rootRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    };
    window.addEventListener(PRELOADED_SAVE_PROMPT_EVENT, onPrompt);
    return () =>
      window.removeEventListener(PRELOADED_SAVE_PROMPT_EVENT, onPrompt);
  }, [openLibraryCopy, saveAllowed]);

  if (!user) {
    return (
      <div
        ref={rootRef}
        className="shrink-0 px-4 py-2 border-b border-[var(--border)] bg-[var(--accent-light)]/40 flex items-center gap-2.5 text-xs leading-snug text-[var(--accent)]"
      >
        <BookmarkPlus className="w-3.5 h-3.5 shrink-0" />
        <span className="flex-1 min-w-0">
          <strong className="text-[var(--text-primary)]">Preloaded</strong>
          {" · "}
          {saveAllowed
            ? `${guestSaveHint} This page stays read-only until then.`
            : saveReason ?? "Official preview only."}
        </span>
        {saveAllowed ? (
          <Link
            href={loginHref}
            className={savePrimaryButtonClass}
            onClick={() =>
              rememberGuestLearnArticle(
                subjectSlug,
                topicSlug,
                articleSlug,
                pageTitle
              )
            }
          >
            Sign in to save
          </Link>
        ) : null}
      </div>
    );
  }

  let message = saveAllowed
    ? saveReason ??
      (saveMode === "download_remote" || saveMode === "copy_admin"
        ? "Tap Save for a personal copy you can highlight, annotate, and edit."
        : "Tap Save to bookmark this official link in your library.")
    : saveReason ?? "Read-only official preview.";
  if (phase === "saving") {
    message = stepLabel || "Saving to your library… You can keep reading.";
  } else if (phase === "ready") {
    message = annotatableCopy
      ? "Saved — opening your library copy so you can highlight and annotate."
      : "Saved to your library as an official link.";
  } else if (error) {
    message = error;
  }

  return (
    <div
      ref={rootRef}
      className="shrink-0 px-4 py-2 border-b border-[var(--border)] bg-[var(--accent-light)]/40 flex flex-col gap-1.5 text-xs leading-snug text-[var(--accent)]"
    >
      <div className="flex items-center gap-2.5">
        <BookmarkPlus className="w-3.5 h-3.5 shrink-0" />
        <span className="flex-1 min-w-0">
          <strong className="text-[var(--text-primary)]">Preloaded</strong>
          {" · "}
          {message}
        </span>
        {saveAllowed && phase === "ready" && savedHref ? (
          <button
            type="button"
            className={saveSecondaryButtonClass}
            onClick={() => openLibraryCopy(savedHref)}
          >
            {annotatableCopy ? "Open library copy" : "Open in library"}
          </button>
        ) : saveAllowed && (phase === "idle" || phase === "error") ? (
          <button
            type="button"
            className={savePrimaryButtonClass}
            onClick={() => save({ openWhenReady: true })}
          >
            Save to My Library
          </button>
        ) : null}
      </div>
      {phase === "saving" ? (
        <div className="pl-6 pr-1">
          <div className="h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
            <div
              className="h-full bg-[var(--accent)] transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[10px] text-[var(--text-muted)] mt-1">
            {Math.round(progress)}%
          </p>
        </div>
      ) : null}
    </div>
  );
}
