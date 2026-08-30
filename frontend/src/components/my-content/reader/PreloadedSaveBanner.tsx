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

export function PreloadedSaveBanner({
  subjectSlug,
  topicSlug,
  articleSlug,
  pageTitle,
  onOpen,
}: {
  subjectSlug: string;
  topicSlug: string;
  articleSlug: string;
  pageTitle: string;
  onOpen: (href: string) => void;
}) {
  const { user } = useAuth();
  const rootRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<SavePhase>("idle");
  const [savedHref, setSavedHref] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loginHref = `/login?next=${encodeURIComponent(
    `/learn/${subjectSlug}/${topicSlug}/${articleSlug}`
  )}`;

  const waitForPublished = useCallback(async (pageId: string) => {
    for (let i = 0; i < 60; i += 1) {
      const { page } = await api.myContent.getPageById(pageId);
      if (page.status === "PUBLISHED") return;
      if (page.status === "FAILED") {
        throw new Error("Could not finish saving this page");
      }
      await new Promise((r) => window.setTimeout(r, 1500));
    }
    throw new Error("Save is taking longer than expected. Try again shortly.");
  }, []);

  const save = useCallback(() => {
    if (phase === "saving") return;
    setPhase("saving");
    setError("");
    void (async () => {
      try {
        const res = await api.myContent.saveCurriculumArticle({
          subjectSlug,
          topicSlug,
          articleSlug,
        });
        emitContentChanged();
        setSavedHref(res.href);
        if (res.alreadySaved || res.status === "PUBLISHED") {
          setPhase("ready");
          return;
        }
        await waitForPublished(res.page.id);
        setPhase("ready");
      } catch (err) {
        setPhase("error");
        setError(err instanceof Error ? err.message : "Could not save");
      }
    })();
  }, [articleSlug, phase, subjectSlug, topicSlug, waitForPublished]);

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
        className="shrink-0 px-4 py-2 border-b border-[var(--border)] bg-[var(--accent-light)]/40 flex items-center gap-2 text-xs text-[var(--accent)]"
      >
        <BookmarkPlus className="w-3.5 h-3.5 shrink-0" />
        <span className="flex-1 min-w-0">
          <strong className="text-[var(--text-primary)]">Preloaded</strong>
          {" · "}
          Sign in to save this page to your library. It stays read-only until
          then.
        </span>
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
      </div>
    );
  }

  let message = "Read-only here. Save a copy to edit in your library.";
  if (phase === "saving") {
    message = "Saving to your library… You can keep reading.";
  } else if (phase === "ready") {
    message = "Saved to your library. Open your copy to highlight and edit.";
  } else if (error) {
    message = error;
  }

  return (
    <div
      ref={rootRef}
      className="shrink-0 px-4 py-2 border-b border-[var(--border)] bg-[var(--accent-light)]/40 flex items-center gap-2 text-xs text-[var(--accent)]"
    >
      <BookmarkPlus className="w-3.5 h-3.5 shrink-0" />
      <span className="flex-1 min-w-0">
        <strong className="text-[var(--text-primary)]">Preloaded</strong>
        {" · "}
        {message}
      </span>
      {phase === "ready" && savedHref ? (
        <button
          type="button"
          className={actionLink}
          onClick={() => onOpen(savedHref)}
        >
          Open in library
        </button>
      ) : phase === "idle" || phase === "error" ? (
        <button type="button" className={actionLink} onClick={save}>
          Save to library
        </button>
      ) : null}
    </div>
  );
}
