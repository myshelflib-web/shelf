"use client";

import { useState } from "react";
import Link from "next/link";
import { BookmarkPlus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { emitContentChanged } from "@/lib/contentEvents";
import { rememberGuestLearnArticle } from "@/lib/guestLearnResume";

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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loginHref = `/login?next=${encodeURIComponent(
    `/learn/${subjectSlug}/${topicSlug}/${articleSlug}`
  )}`;

  const save = async () => {
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      const res = await api.myContent.saveCurriculumArticle({
        subjectSlug,
        topicSlug,
        articleSlug,
      });
      emitContentChanged();
      onOpen(res.href);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="shrink-0 px-4 py-2 border-b border-[var(--border)] bg-[var(--accent-light)]/40 flex items-center gap-2 text-xs text-[var(--accent)]">
        <BookmarkPlus className="w-3.5 h-3.5 shrink-0" />
        <span className="flex-1 min-w-0">
          <strong className="text-[var(--text-primary)]">Preloaded</strong>
          {" · "}
          Sign in to save this page to your library. It stays read-only until then.
        </span>
        <Link
          href={loginHref}
          className="shrink-0 h-7 px-2.5 rounded-lg border border-[var(--accent)]/40 bg-[var(--bg-elevated)] text-[10px] font-semibold"
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

  return (
    <div className="shrink-0 px-4 py-2 border-b border-[var(--border)] bg-[var(--accent-light)]/40 flex items-center gap-2 text-xs text-[var(--accent)]">
      <BookmarkPlus className="w-3.5 h-3.5 shrink-0" />
      <span className="flex-1 min-w-0">
        <strong className="text-[var(--text-primary)]">Preloaded</strong>
        {" · "}
        {error || "Read-only here. Save a copy to edit in your library."}
      </span>
      <button
        type="button"
        className="shrink-0 h-7 px-2.5 rounded-lg border border-[var(--accent)]/40 bg-[var(--bg-elevated)] text-[10px] font-semibold disabled:opacity-50"
        disabled={saving}
        onClick={() => void save()}
      >
        {saving ? "Saving…" : "Save to library"}
      </button>
    </div>
  );
}
