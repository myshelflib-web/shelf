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

const SAVE_STEPS: Record<string, string> = {
  link: "Adding official link to your library…",
  copy_admin: "Copying to your library…",
  download_remote: "Downloading official document to your library…",
  none: "Saving…",
};

function progressForPoll(poll: number, saveMode?: string): number {
  const base = saveMode === "download_remote" ? 15 : 20;
  return Math.min(92, base + poll * 7);
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
  saveMode?: "copy_admin" | "download_remote" | "link" | "none";
  onOpen: (href: string) => void;
}) {
  const { user } = useAuth();
  const rootRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<SavePhase>("idle");
  const [savedHref, setSavedHref] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [stepLabel, setStepLabel] = useState("");

  const loginHref = `/login?next=${encodeURIComponent(
    `/learn/${subjectSlug}/${topicSlug}/${articleSlug}`
  )}`;

  const guestSaveHint =
    saveMode === "download_remote"
      ? "Sign in to download a personal copy to your library."
      : "Sign in to save this official link to your library.";

  const waitForPublished = useCallback(
    async (pageId: string, saveMode?: string) => {
      for (let i = 0; i < 60; i += 1) {
        setProgress(progressForPoll(i, saveMode));
        const { page } = await api.myContent.getPageById(pageId);
        if (page.status === "PUBLISHED") {
          setProgress(100);
          return;
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

  const save = useCallback(() => {
    if (phase === "saving" || !saveAllowed) return;
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
        const mode = res.saveMode ?? "copy_admin";
        setStepLabel(SAVE_STEPS[mode] ?? res.saveReason ?? "Saving…");
        setProgress(mode === "link" ? 100 : 25);
        if (res.alreadySaved || res.status === "PUBLISHED") {
          setPhase("ready");
          setProgress(100);
          return;
        }
        await waitForPublished(res.page.id, mode);
        setPhase("ready");
      } catch (err) {
        setPhase("error");
        setProgress(0);
        setError(err instanceof Error ? err.message : "Could not save");
      }
    })();
  }, [articleSlug, phase, saveAllowed, subjectSlug, topicSlug, waitForPublished]);

  useEffect(() => {
    const onPrompt = () => {
      rootRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    };
    window.addEventListener(PRELOADED_SAVE_PROMPT_EVENT, onPrompt);
    return () =>
      window.removeEventListener(PRELOADED_SAVE_PROMPT_EVENT, onPrompt);
  }, []);

  const actionLink =
    "shrink-0 text-[10px] font-semibold text-[var(--accent)] hover:underline disabled:opacity-50";

  if (!user) {
    return (
      <div
        ref={rootRef}
        className="shrink-0 px-4 py-2 border-b border-[var(--border)] bg-[var(--accent-light)]/40 flex flex-col gap-2 text-xs text-[var(--accent)]"
      >
        <div className="flex items-center gap-2">
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
              className={actionLink}
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
      </div>
    );
  }

  let message = saveAllowed
    ? saveReason ??
      (saveMode === "download_remote"
        ? "Tap Save to download a personal copy to your library."
        : "Tap Save to bookmark this official link in your library.")
    : saveReason ?? "Read-only official preview.";
  if (phase === "saving") {
    message = stepLabel || "Saving to your library… You can keep reading.";
  } else if (phase === "ready") {
    message =
      saveMode === "link"
        ? "Saved to your library as an official link. Open it to highlight and add notes."
        : "Saved to your library. Open your copy to highlight and edit.";
  } else if (error) {
    message = error;
  }

  return (
    <div
      ref={rootRef}
      className="shrink-0 px-4 py-2 border-b border-[var(--border)] bg-[var(--accent-light)]/40 flex flex-col gap-2 text-xs text-[var(--accent)]"
    >
      <div className="flex items-center gap-2">
        <BookmarkPlus className="w-3.5 h-3.5 shrink-0" />
        <span className="flex-1 min-w-0">
          <strong className="text-[var(--text-primary)]">Preloaded</strong>
          {" · "}
          {message}
        </span>
        {saveAllowed && phase === "ready" && savedHref ? (
          <button
            type="button"
            className={actionLink}
            onClick={() => onOpen(savedHref)}
          >
            Open in library
          </button>
        ) : saveAllowed && (phase === "idle" || phase === "error") ? (
          <button type="button" className={actionLink} onClick={save}>
            Save to library
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
          <p className="text-[10px] text-[var(--text-muted)] mt-1">{Math.round(progress)}%</p>
        </div>
      ) : null}
    </div>
  );
}
