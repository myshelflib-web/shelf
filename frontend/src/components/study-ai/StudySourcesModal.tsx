"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { api } from "@/lib/api";
import { CircleLoader } from "@/components/CircleLoader";
import {
  chatContextLabel,
  normalizeContextKind,
} from "@/lib/studyAiContextLabel";
import type {
  ChatContextKind,
  ChatThreadSummary,
  StudyRelevancyDoc,
  StudyRelevancyDocSummary,
  UserSubject,
} from "@/types";
import { AddRelevancyModal } from "./AddRelevancyModal";

const fieldClass =
  "mt-1 w-full px-3 py-2 text-sm rounded-[10px] bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--ring)] disabled:opacity-50";

type Draft = {
  contextKind: ChatContextKind;
  contextNotebookId: string;
  contextTopicId: string;
  contextPageId: string;
  relevancyDocId: string;
};

function draftFromThread(thread: ChatThreadSummary | null): Draft {
  return {
    contextKind: normalizeContextKind(thread?.contextKind),
    contextNotebookId: thread?.contextNotebookId ?? "",
    contextTopicId: thread?.contextTopicId ?? "",
    contextPageId: thread?.contextPageId ?? "",
    relevancyDocId: thread?.relevancyDocId ?? "",
  };
}

function pagesForDraft(
  notebooks: UserSubject[],
  kind: ChatContextKind,
  notebookId: string,
  topicId: string
) {
  const nb = notebooks.find((n) => n.id === notebookId);
  if (!nb || kind !== "PAGE") return [];
  if (topicId === "__notebook__") return nb.pages ?? [];
  if (topicId) {
    const topic = nb.topicGroups?.find((t) => t.id === topicId);
    return topic?.pages ?? [];
  }
  return [
    ...(nb.pages ?? []),
    ...(nb.topicGroups ?? []).flatMap((t) => t.pages ?? []),
  ];
}

function pickDefaultsForKind(
  nextKind: ChatContextKind,
  notebooks: UserSubject[],
  selectedNotebook?: UserSubject
): Partial<Draft> {
  const nb = selectedNotebook ?? notebooks[0];
  if (nextKind === "LIBRARY") {
    return {
      contextKind: "LIBRARY",
      contextNotebookId: "",
      contextTopicId: "",
      contextPageId: "",
    };
  }
  if (!nb) {
    return {
      contextKind: nextKind,
      contextNotebookId: "",
      contextTopicId: "",
      contextPageId: "",
    };
  }
  if (nextKind === "NOTEBOOK") {
    return {
      contextKind: "NOTEBOOK",
      contextNotebookId: nb.id,
      contextTopicId: "",
      contextPageId: "",
    };
  }
  if (nextKind === "TOPIC") {
    const topic = nb.topicGroups?.[0];
    return {
      contextKind: "TOPIC",
      contextNotebookId: nb.id,
      contextTopicId: topic?.id ?? "",
      contextPageId: "",
    };
  }
  const topic = nb.topicGroups?.[0];
  const page = topic?.pages?.[0] ?? nb.pages?.[0];
  return {
    contextKind: "PAGE",
    contextNotebookId: nb.id,
    contextTopicId: topic?.id ?? (nb.pages?.length ? "__notebook__" : ""),
    contextPageId: page?.id ?? "",
  };
}

export function StudySourcesModal({
  threadId,
  thread,
  onThreadUpdated,
  onClose,
}: {
  threadId?: string;
  thread: ChatThreadSummary | null;
  onThreadUpdated: (t: ChatThreadSummary) => void;
  onClose: () => void;
}) {
  const [notebooks, setNotebooks] = useState<UserSubject[]>([]);
  const [notebooksLoading, setNotebooksLoading] = useState(true);
  const [docs, setDocs] = useState<StudyRelevancyDocSummary[]>([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const [docLimit, setDocLimit] = useState(10);
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<Draft>(() => draftFromThread(thread));
  const [activeThreadId, setActiveThreadId] = useState(threadId);

  const kind = draft.contextKind;
  const selectedNotebook = notebooks.find(
    (n) => n.id === draft.contextNotebookId
  );
  const topics = selectedNotebook?.topicGroups ?? [];
  const notebookPages = selectedNotebook?.pages ?? [];
  const pageOptions = pagesForDraft(
    notebooks,
    kind,
    draft.contextNotebookId,
    draft.contextTopicId
  );

  const refreshDocs = useCallback(() => {
    setDocsLoading(true);
    return api.study
      .listRelevancyDocs()
      .then(({ docs: list, limit }) => {
        setDocs(list);
        setDocLimit(limit);
      })
      .catch(() => {})
      .finally(() => setDocsLoading(false));
  }, []);

  useEffect(() => {
    setDraft(draftFromThread(thread));
    setActiveThreadId(threadId ?? thread?.id);
  }, [thread, threadId]);

  useEffect(() => {
    setNotebooksLoading(true);
    api.myContent
      .listSubjects({ pageSize: 100, sort: "name" })
      .then(({ subjects }) => setNotebooks(subjects))
      .catch(() => setNotebooks([]))
      .finally(() => setNotebooksLoading(false));
    refreshDocs();
  }, [refreshDocs]);

  // After notebooks load, fill in a real notebook/topic/page if scope needs one.
  useEffect(() => {
    if (notebooksLoading || notebooks.length === 0) return;
    if (draft.contextKind === "LIBRARY") return;
    const nbOk =
      draft.contextNotebookId &&
      notebooks.some((n) => n.id === draft.contextNotebookId);
    if (nbOk) return;
    const filled = {
      ...draft,
      ...pickDefaultsForKind(draft.contextKind, notebooks, undefined),
    };
    setDraft(filled);
    void persistDraft(filled);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when library tree arrives
  }, [notebooksLoading, notebooks]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !showAdd) onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, showAdd]);

  const ensureThread = async (): Promise<string | null> => {
    if (activeThreadId) return activeThreadId;
    try {
      const { thread: created } = await api.study.createChat({
        title: "New chat",
      });
      setActiveThreadId(created.id);
      onThreadUpdated(created);
      window.history.replaceState(null, "", `/study-ai/${created.id}`);
      return created.id;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start chat");
      return null;
    }
  };

  const persistDraft = async (next: Draft) => {
    setSaving(true);
    setError("");
    try {
      const id = await ensureThread();
      if (!id) return;
      const topicId =
        next.contextKind === "TOPIC" || next.contextKind === "PAGE"
          ? next.contextTopicId && next.contextTopicId !== "__notebook__"
            ? next.contextTopicId
            : null
          : null;
      const payload = {
        contextKind: next.contextKind,
        contextNotebookId:
          next.contextKind === "LIBRARY"
            ? null
            : next.contextNotebookId || null,
        contextTopicId: topicId,
        contextPageId:
          next.contextKind === "PAGE" ? next.contextPageId || null : null,
        relevancyDocId: next.relevancyDocId || null,
      };
      const { thread: updated } = await api.study.updateChat(id, payload);
      onThreadUpdated(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update");
    } finally {
      setSaving(false);
    }
  };

  const apply = (patch: Partial<Draft>) => {
    const next = { ...draft, ...patch };
    setDraft(next);
    void persistDraft(next);
  };

  const onScopeChange = (nextKind: ChatContextKind) => {
    apply(pickDefaultsForKind(nextKind, notebooks, selectedNotebook));
  };

  const summary = chatContextLabel(
    {
      contextKind: draft.contextKind,
      contextNotebookId: draft.contextNotebookId || null,
      contextTopicId:
        draft.contextTopicId && draft.contextTopicId !== "__notebook__"
          ? draft.contextTopicId
          : null,
      contextPageId: draft.contextPageId || null,
    },
    notebooks
  );
  const syllabusTitle =
    docs.find((d) => d.id === draft.relevancyDocId)?.title ??
    thread?.relevancyDoc?.title ??
    "General";

  const topicSelectValue =
    draft.contextTopicId ||
    (kind === "PAGE" && notebookPages.length > 0 ? "__notebook__" : "");

  return (
    <>
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <button
          type="button"
          aria-label="Close"
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
        />
        <div
          role="dialog"
          aria-label="Sources"
          className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-[10px] border border-[var(--border)] bg-[var(--bg-elevated)] shadow-2xl"
        >
          <div className="flex items-center justify-between gap-2 px-5 py-4 border-b border-[var(--border)]">
            <div>
              <h2 className="font-semibold text-[var(--text-primary)]">
                Sources
              </h2>
              <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
                Where Study AI looks, and which syllabus to follow.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            <section className="space-y-3">
              <h3 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Library context
              </h3>
              {notebooksLoading ? (
                <div className="flex justify-center py-8">
                  <CircleLoader size="md" label="Loading library" />
                </div>
              ) : (
                <>
              <label className="block text-[12px] text-[var(--text-secondary)]">
                Scope
                <select
                  className={fieldClass}
                  disabled={saving}
                  value={kind}
                  onChange={(e) => {
                    onScopeChange(e.target.value as ChatContextKind);
                  }}
                >
                  <option value="LIBRARY">All library</option>
                  <option value="NOTEBOOK">One collection</option>
                  <option value="TOPIC">One topic</option>
                  <option value="PAGE">One page</option>
                </select>
              </label>

              {kind !== "LIBRARY" && (
                <label className="block text-[12px] text-[var(--text-secondary)]">
                  Collection
                  <select
                    className={fieldClass}
                    disabled={saving || notebooks.length === 0}
                    value={draft.contextNotebookId}
                    onChange={(e) => {
                      const id = e.target.value;
                      const nb = notebooks.find((n) => n.id === id);
                      if (kind === "NOTEBOOK") {
                        apply({
                          contextNotebookId: id,
                          contextTopicId: "",
                          contextPageId: "",
                        });
                        return;
                      }
                      if (kind === "TOPIC") {
                        const topic = nb?.topicGroups?.[0];
                        apply({
                          contextNotebookId: id,
                          contextTopicId: topic?.id ?? "",
                          contextPageId: "",
                        });
                        return;
                      }
                      const topic = nb?.topicGroups?.[0];
                      const page = topic?.pages?.[0] ?? nb?.pages?.[0];
                      apply({
                        contextNotebookId: id,
                        contextTopicId:
                          topic?.id ?? (nb?.pages?.length ? "__notebook__" : ""),
                        contextPageId: page?.id ?? "",
                      });
                    }}
                  >
                    {notebooks.length === 0 && (
                      <option value="">No collections yet</option>
                    )}
                    {notebooks.map((n) => (
                      <option key={n.id} value={n.id}>
                        {n.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {(kind === "TOPIC" || kind === "PAGE") && (
                <label className="block text-[12px] text-[var(--text-secondary)]">
                  Topic
                  <select
                    className={fieldClass}
                    disabled={
                      saving ||
                      !draft.contextNotebookId ||
                      (topics.length === 0 && notebookPages.length === 0)
                    }
                    value={topicSelectValue}
                    onChange={(e) => {
                      const id = e.target.value;
                      if (kind === "TOPIC") {
                        apply({
                          contextTopicId: id === "__notebook__" ? "" : id,
                          contextPageId: "",
                        });
                        return;
                      }
                      if (id === "__notebook__") {
                        const page = notebookPages[0];
                        apply({
                          contextTopicId: "__notebook__",
                          contextPageId: page?.id ?? "",
                        });
                        return;
                      }
                      const topic = topics.find((t) => t.id === id);
                      const page = topic?.pages?.[0];
                      apply({
                        contextTopicId: id,
                        contextPageId: page?.id ?? "",
                      });
                    }}
                  >
                    {kind === "TOPIC" && topics.length === 0 && (
                      <option value="">No topics in this collection</option>
                    )}
                    {kind === "PAGE" && notebookPages.length > 0 && (
                      <option value="__notebook__">
                        Collection pages (no topic)
                      </option>
                    )}
                    {topics.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {kind === "PAGE" && (
                <label className="block text-[12px] text-[var(--text-secondary)]">
                  Page
                  <select
                    className={fieldClass}
                    disabled={saving || pageOptions.length === 0}
                    value={draft.contextPageId}
                    onChange={(e) => {
                      apply({ contextPageId: e.target.value });
                    }}
                  >
                    {pageOptions.length === 0 && (
                      <option value="">No pages here</option>
                    )}
                    {pageOptions.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {kind !== "LIBRARY" && notebooks.length === 0 && (
                  <p className="text-[12px] text-[var(--text-muted)]">
                    Add a collection in Library first, then pick it here.
                  </p>
                )}
                </>
              )}
            </section>

            <section className="space-y-3 pt-1 border-t border-[var(--border)]">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  Syllabus
                </h3>
                <span className="text-[10px] text-[var(--text-muted)] tabular-nums">
                  {docsLoading ? "…" : `${docs.length}/${docLimit} saved`}
                </span>
              </div>
              {docsLoading ? (
                <div className="flex justify-center py-6">
                  <CircleLoader size="sm" label="Loading syllabus" />
                </div>
              ) : (
                <>
              <label className="block text-[12px] text-[var(--text-secondary)]">
                Relevancy doc
                <select
                  className={fieldClass}
                  disabled={saving}
                  value={draft.relevancyDocId}
                  onChange={(e) => {
                    apply({ relevancyDocId: e.target.value });
                  }}
                >
                  <option value="">General</option>
                  {docs.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                disabled={saving}
                onClick={() => setShowAdd(true)}
                className="inline-flex items-center gap-1.5 text-[13px] px-3 py-2 rounded-[10px] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                Add syllabus or relevancy doc
              </button>
                </>
              )}
            </section>

            {error && (
              <p className="text-[12px] text-red-400 leading-relaxed">{error}</p>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-[var(--border)] bg-[var(--bg-secondary)]/40">
            <p className="text-[11px] text-[var(--text-muted)] truncate min-w-0">
              {summary}
              <span className="mx-1 opacity-40">·</span>
              {syllabusTitle}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 text-[13px] px-3 py-1.5 rounded-[10px] bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]"
            >
              Done
            </button>
          </div>
        </div>
      </div>

      {showAdd && (
        <AddRelevancyModal
          onClose={() => setShowAdd(false)}
          onCreated={(doc: StudyRelevancyDoc) => {
            refreshDocs();
            apply({ relevancyDocId: doc.id });
          }}
        />
      )}
    </>
  );
}
