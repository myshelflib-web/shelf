"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { api } from "@/lib/api";
import { UserSubject, UserTopicGroup } from "@/types";
import { getTopicGroups, pageHref } from "@/lib/myContentTree";

interface ClipSaveModalProps {
  imageDataUrl: string;
  notebook?: UserSubject | null;
  topic?: UserTopicGroup | null;
  currentPageId: string;
  currentContent?: string;
  canAppend: boolean;
  onClose: () => void;
  onSaved: (href?: string) => void;
}

export function ClipSaveModal({
  imageDataUrl,
  notebook,
  topic,
  currentPageId,
  currentContent = "",
  canAppend,
  onClose,
  onSaved,
}: ClipSaveModalProps) {
  const groups = useMemo(
    () => (notebook ? getTopicGroups(notebook) : []),
    [notebook]
  );
  const clipPages = useMemo(
    () =>
      groups.flatMap((g) =>
        g.pages
          .filter(
            (p) =>
              p.contentType === "HTML" ||
              p.contentType === "MARKDOWN" ||
              p.contentType === "TEXT" ||
              p.contentType === "DOCX"
          )
          .map((p) => ({
            id: p.id,
            title: p.title,
            slug: p.slug,
            topicSlug: g.slug,
            topicTitle: g.title,
          }))
      ),
    [groups]
  );

  const [title, setTitle] = useState("Clip");
  const [mode, setMode] = useState<"new" | "append">(
    canAppend || clipPages.length > 0 ? "append" : "new"
  );
  const [topicId, setTopicId] = useState(topic?.id ?? groups[0]?.id ?? "");
  const pagesInTopic = useMemo(() => {
    const group = groups.find((g) => g.id === topicId) ?? groups[0];
    return (group?.pages ?? []).filter(
      (p) =>
        p.contentType === "HTML" ||
        p.contentType === "MARKDOWN" ||
        p.contentType === "TEXT" ||
        p.contentType === "DOCX"
    );
  }, [groups, topicId]);
  const [appendId, setAppendId] = useState(
    canAppend ? currentPageId : pagesInTopic[0]?.id ?? currentPageId
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const imgHtml = `<p><img src="${imageDataUrl}" alt="${title.replace(/"/g, "")}" /></p>`;

  const save = async () => {
    setBusy(true);
    setError("");
    try {
      if (mode === "append") {
        if (appendId === currentPageId && canAppend) {
          await api.myContent.updateContent(
            currentPageId,
            `${currentContent}${imgHtml}`
          );
          onSaved();
          onClose();
          return;
        }
        const target = clipPages.find((p) => p.id === appendId);
        if (!target || !notebook) throw new Error("Choose a clips page to add to.");
        const { page } = await api.myContent.getPage(
          notebook.slug,
          target.topicSlug,
          target.slug
        );
        await api.myContent.updateContent(
          page.id,
          `${page.content ?? ""}${imgHtml}`
        );
        onSaved(
          pageHref(notebook.slug, target.topicSlug, target.slug)
        );
        onClose();
        return;
      }

      const body = {
        title: title.trim() || "Clip",
        htmlContent: `<h2>${title.trim() || "Clip"}</h2>${imgHtml}`,
      };

      if (notebook && (topicId || topic)) {
        const group =
          groups.find((g) => g.id === topicId) ?? topic ?? groups[0];
        if (group) {
          const { page } = await api.myContent.createPage(
            notebook.id,
            group.id,
            body
          );
          onSaved(pageHref(notebook.slug, group.slug, page.slug));
          onClose();
          return;
        }
      }

      if (notebook) {
        const { page } = await api.myContent.createNotebookPage(
          notebook.id,
          body
        );
        onSaved(pageHref(notebook.slug, null, page.slug));
        onClose();
        return;
      }

      const { page } = await api.myContent.createRootPage(body);
      onSaved(pageHref(null, null, page.slug));
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save clip");
    } finally {
      setBusy(false);
    }
  };

  const canSaveAppend = mode === "new" || clipPages.length > 0 || canAppend;
  const showTopicPicker = groups.length > 0;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div
        role="dialog"
        className="relative w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-2xl p-5"
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Save clip</h2>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
        {/* Clip is a data URL; next/image is not suitable here. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageDataUrl}
          alt="Clip preview"
          className="w-full max-h-40 object-contain rounded-lg border border-[var(--border)] mb-3 bg-[var(--bg-secondary)]"
        />
        <div className="flex gap-2 mb-3">
          <button
            type="button"
            className={`flex-1 py-2 rounded-lg text-sm border ${mode === "new" ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--accent-light)]" : "border-[var(--border)]"}`}
            onClick={() => setMode("new")}
          >
            New page
          </button>
          <button
            type="button"
            disabled={!canSaveAppend}
            className={`flex-1 py-2 rounded-lg text-sm border ${mode === "append" ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--accent-light)]" : "border-[var(--border)]"} disabled:opacity-40`}
            onClick={() => canSaveAppend && setMode("append")}
          >
            Existing page
          </button>
        </div>
        {mode === "new" ? (
          <>
            {showTopicPicker ? (
              <>
                <label className="block text-xs text-[var(--text-muted)] mb-1">
                  Topic
                </label>
                <select
                  value={topicId}
                  onChange={(e) => setTopicId(e.target.value)}
                  className="w-full px-3 py-2 mb-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-sm"
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title}
                    </option>
                  ))}
                </select>
              </>
            ) : null}
            <label className="block text-xs text-[var(--text-muted)] mb-1">
              New page title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Page title"
              className="w-full px-3 py-2 mb-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-sm"
            />
          </>
        ) : (
          <>
            {showTopicPicker ? (
              <>
                <label className="block text-xs text-[var(--text-muted)] mb-1">
                  Topic
                </label>
                <select
                  value={topicId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setTopicId(id);
                    const group = groups.find((g) => g.id === id);
                    const first = (group?.pages ?? []).find(
                      (p) =>
                        p.contentType === "HTML" ||
                        p.contentType === "MARKDOWN" ||
                        p.contentType === "TEXT" ||
                        p.contentType === "DOCX"
                    );
                    setAppendId(first?.id ?? "");
                  }}
                  className="w-full px-3 py-2 mb-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-sm"
                >
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title}
                    </option>
                  ))}
                </select>
                <label className="block text-xs text-[var(--text-muted)] mb-1">
                  Page
                </label>
                <select
                  value={appendId}
                  onChange={(e) => setAppendId(e.target.value)}
                  className="w-full px-3 py-2 mb-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-sm"
                >
                  {pagesInTopic.length === 0 ? (
                    <option value="">No note pages in this topic</option>
                  ) : (
                    pagesInTopic.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                        {p.id === currentPageId ? " (this page)" : ""}
                      </option>
                    ))
                  )}
                </select>
              </>
            ) : (
              <p className="text-sm text-[var(--text-muted)] mb-2">
                {canAppend
                  ? "Append this clip to the current page."
                  : "Create a new note page for this clip."}
              </p>
            )}
          </>
        )}
        {error && <p className="text-xs text-red-400 mb-2">{error}</p>}
        <button
          type="button"
          disabled={
            busy ||
            (mode === "append" &&
              !appendId &&
              !(canAppend && appendId === currentPageId))
          }
          className="btn-primary"
          onClick={() => void save()}
        >
          {busy ? "Saving…" : "Save clip"}
        </button>
      </div>
    </div>
  );
}
