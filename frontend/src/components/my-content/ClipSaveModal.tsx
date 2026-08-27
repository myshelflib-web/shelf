"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { api } from "@/lib/api";
import { UserSubject, UserTopicGroup } from "@/types";
import { getNotebookPages, getTopicGroups, pageHref } from "@/lib/myContentTree";
import { peekCachedLibrary } from "@/lib/offline/library";
import {
  clipTargetLabel,
  clipTargetsFromRootPages,
  clipTargetsFromSubject,
  groupClipTargets,
  isClipNotePage,
  mergeClipTargets,
  type ClipTarget,
} from "@/lib/clipSaveTargets";

const COLLECTION_SCOPE = "__collection__";

function cachedClipTargets(): ClipTarget[] {
  const cached = peekCachedLibrary();
  if (!cached) return [];
  return mergeClipTargets(
    ...cached.subjects.map(clipTargetsFromSubject),
    clipTargetsFromRootPages(cached.rootPages)
  );
}

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
    () =>
      notebook ? getNotebookPages(notebook).filter(isClipNotePage) : [],
    [notebook]
  );
  const notebookTargets = useMemo(
    () => (notebook ? clipTargetsFromSubject(notebook) : []),
    [notebook]
  );
  const [libraryTargets, setLibraryTargets] = useState(cachedClipTargets);
  const clipPages = useMemo(
    () => mergeClipTargets(notebookTargets, libraryTargets),
    [notebookTargets, libraryTargets]
  );

  const scopeOptions = useMemo(() => {
    const opts: { id: string; label: string }[] = [];
    if (notebook) opts.push({ id: COLLECTION_SCOPE, label: "Collection" });
    for (const g of groups) {
      opts.push({ id: g.id, label: g.title });
    }
    return opts;
  }, [notebook, groups]);

  const initialScope = useMemo(() => {
    if (topic?.id) return topic.id;
    if (collectionPages.some((p) => p.id === currentPageId)) {
      return COLLECTION_SCOPE;
    }
    if (groups[0]?.id) return groups[0].id;
    if (notebook) return COLLECTION_SCOPE;
    return "";
  }, [topic, collectionPages, groups, currentPageId, notebook]);

  const [title, setTitle] = useState("Clip");
  const [mode, setMode] = useState<"new" | "append">(() =>
    canAppend || notebookTargets.length > 0 || cachedClipTargets().length > 0
      ? "append"
      : "new"
  );
  const [scopeId, setScopeId] = useState(initialScope);
  const [appendId, setAppendId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLibraryTargets(cachedClipTargets());
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (appendId && clipPages.some((p) => p.id === appendId)) return;
    if (canAppend) {
      setAppendId(currentPageId);
      return;
    }
    setAppendId(clipPages[0]?.id ?? "");
  }, [appendId, canAppend, clipPages, currentPageId]);

  const grouped = useMemo(() => groupClipTargets(clipPages), [clipPages]);
  const hasExisting = clipPages.length > 0 || canAppend;
  const imgHtml = `<p><img src="${imageDataUrl}" alt="${title.replace(/"/g, "")}" /></p>`;

  const save = async () => {
    setBusy(true);
    setError("");
    try {
      if (mode === "append") {
        const id = appendId || (canAppend ? currentPageId : "");
        if (!id) throw new Error("Choose a note page to add to.");
        if (id === currentPageId && canAppend) {
          await api.myContent.updateContent(
            currentPageId,
            `${currentContent}${imgHtml}`
          );
          onSaved();
          onClose();
          return;
        }
        const { page } = await api.myContent.getPageById(id);
        if (page.contentType === "PDF" || page.contentType === "LINK") {
          throw new Error("Clips can only be added to note pages.");
        }
        await api.myContent.updateContent(
          page.id,
          `${page.content ?? ""}${imgHtml}`
        );
        onSaved(
          pageHref(
            page.notebook?.slug ?? null,
            page.topic?.slug ?? null,
            page.slug
          )
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
            className={`flex-1 py-2 rounded-lg text-sm border ${mode === "append" ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--accent-light)]" : "border-[var(--border)]"}`}
            onClick={() => setMode("append")}
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
        ) : hasExisting ? (
          <>
            <label className="block text-xs text-[var(--text-muted)] mb-1">
              Page
            </label>
            <select
              value={appendId}
              onChange={(e) => setAppendId(e.target.value)}
              className="w-full px-3 py-2 mb-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-sm"
            >
              {canAppend &&
              !clipPages.some((p) => p.id === currentPageId) ? (
                <option value={currentPageId}>This page</option>
              ) : null}
              {grouped.map((g) => (
                <optgroup key={g.key} label={g.label}>
                  {g.pages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {clipTargetLabel(p)}
                      {p.id === currentPageId ? " (this page)" : ""}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </>
        ) : (
          <p className="text-sm text-[var(--text-muted)] mb-2">
            No note pages yet. Use New page to create one, then clips can be
            added to it.
          </p>
        )}
        {error && <p className="text-xs text-red-400 mb-2">{error}</p>}
        <button
          type="button"
          disabled={
            busy || (mode === "append" && !hasExisting && !canAppend)
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
