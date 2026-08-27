"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { api } from "@/lib/api";
import { UserPageSummary, UserSubject, UserTopicGroup } from "@/types";
import {
  getNotebookPages,
  getTopicGroups,
  pageHref,
} from "@/lib/myContentTree";

const COLLECTION_SCOPE = "__collection__";

const NOTE_TYPES = new Set(["HTML", "MARKDOWN", "TEXT", "DOCX"]);

function isNotePage(page: UserPageSummary) {
  return page.contentType != null && NOTE_TYPES.has(page.contentType);
}

type ClipTarget = {
  id: string;
  title: string;
  slug: string;
  topicSlug: string | null;
};

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
  const collectionPages = useMemo(
    () => (notebook ? getNotebookPages(notebook).filter(isNotePage) : []),
    [notebook]
  );
  const clipPages = useMemo(() => {
    const loose: ClipTarget[] = collectionPages.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      topicSlug: null,
    }));
    const fromTopics = groups.flatMap((g) =>
      g.pages.filter(isNotePage).map((p) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        topicSlug: g.slug,
      }))
    );
    return [...loose, ...fromTopics];
  }, [collectionPages, groups]);

  const scopeOptions = useMemo(() => {
    const opts: { id: string; label: string }[] = [];
    if (collectionPages.length > 0) {
      opts.push({ id: COLLECTION_SCOPE, label: "Collection" });
    }
    for (const g of groups) {
      opts.push({ id: g.id, label: g.title });
    }
    return opts;
  }, [collectionPages, groups]);

  const initialScope = useMemo(() => {
    if (topic?.id) return topic.id;
    if (collectionPages.some((p) => p.id === currentPageId)) {
      return COLLECTION_SCOPE;
    }
    if (groups[0]?.id) return groups[0].id;
    if (collectionPages.length > 0) return COLLECTION_SCOPE;
    return groups[0]?.id ?? "";
  }, [topic, collectionPages, groups, currentPageId]);

  const [title, setTitle] = useState("Clip");
  const [mode, setMode] = useState<"new" | "append">(
    canAppend || clipPages.length > 0 ? "append" : "new"
  );
  const [scopeId, setScopeId] = useState(initialScope);
  const pagesInScope = useMemo(() => {
    if (scopeId === COLLECTION_SCOPE) return collectionPages;
    const group = groups.find((g) => g.id === scopeId) ?? groups[0];
    return (group?.pages ?? []).filter(isNotePage);
  }, [scopeId, collectionPages, groups]);
  const [appendId, setAppendId] = useState(() => {
    if (canAppend) return currentPageId;
    const scopePages =
      initialScope === COLLECTION_SCOPE
        ? collectionPages
        : (groups.find((g) => g.id === initialScope) ?? groups[0])?.pages.filter(
            isNotePage
          ) ?? [];
    return scopePages[0]?.id ?? "";
  });
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
        const { page } = target.topicSlug
          ? await api.myContent.getPage(
              notebook.slug,
              target.topicSlug,
              target.slug
            )
          : await api.myContent.getNotebookFilePage(notebook.slug, target.slug);
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

      if (notebook && scopeId && scopeId !== COLLECTION_SCOPE) {
        const group =
          groups.find((g) => g.id === scopeId) ?? topic ?? groups[0];
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
  const showScopePicker = scopeOptions.length > 0;

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
            {showScopePicker ? (
              <>
                <label className="block text-xs text-[var(--text-muted)] mb-1">
                  {scopeOptions.length > 1 ? "Topic" : "Location"}
                </label>
                <select
                  value={scopeId}
                  onChange={(e) => setScopeId(e.target.value)}
                  className="w-full px-3 py-2 mb-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-sm"
                >
                  {scopeOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
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
            {showScopePicker ? (
              <>
                <label className="block text-xs text-[var(--text-muted)] mb-1">
                  {scopeOptions.length > 1 ? "Topic" : "Location"}
                </label>
                <select
                  value={scopeId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setScopeId(id);
                    const pages =
                      id === COLLECTION_SCOPE
                        ? collectionPages
                        : (groups.find((g) => g.id === id)?.pages ?? []).filter(
                            isNotePage
                          );
                    const preferred = pages.find((p) => p.id === currentPageId);
                    setAppendId(preferred?.id ?? pages[0]?.id ?? "");
                  }}
                  className="w-full px-3 py-2 mb-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-sm"
                >
                  {scopeOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <label className="block text-xs text-[var(--text-muted)] mb-1">
                  Page
                </label>
                <select
                  value={
                    pagesInScope.some((p) => p.id === appendId) ? appendId : ""
                  }
                  onChange={(e) => setAppendId(e.target.value)}
                  className="w-full px-3 py-2 mb-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-sm"
                >
                  {pagesInScope.length === 0 ? (
                    <option value="">No note pages in this topic</option>
                  ) : (
                    pagesInScope.map((p) => (
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
