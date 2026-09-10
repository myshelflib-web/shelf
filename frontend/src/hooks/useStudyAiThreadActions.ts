"use client";

import {
  useCallback,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from "react";
import { api } from "@/lib/api";
import type { ChatThreadSummary, LibraryCitation } from "@/types";
import type { WorkspaceMessage } from "@/lib/studyAiWorkspaceUtils";
import type { StudyAiQueuedPrompt } from "@/lib/studyAiQueue";
import type { StreamStatusEvent } from "@/components/study-ai/StreamActivity";

type Args = {
  threads: ChatThreadSummary[];
  threadMeta: ChatThreadSummary | null;
  setThreads: Dispatch<SetStateAction<ChatThreadSummary[]>>;
  setThreadMeta: Dispatch<SetStateAction<ChatThreadSummary | null>>;
  setTitle: Dispatch<SetStateAction<string>>;
  setMessages: Dispatch<SetStateAction<WorkspaceMessage[]>>;
  setError: Dispatch<SetStateAction<string>>;
  setQueue: Dispatch<SetStateAction<StudyAiQueuedPrompt[]>>;
  setLoading: Dispatch<SetStateAction<boolean>>;
  setStatusEvents: Dispatch<SetStateAction<StreamStatusEvent[]>>;
  setLiveCitations: Dispatch<
    SetStateAction<LibraryCitation[] | undefined>
  >;
  queueRef: MutableRefObject<StudyAiQueuedPrompt[]>;
  activeIdRef: MutableRefObject<string | undefined>;
  abortRef: MutableRefObject<AbortController | null>;
  streamingRef: MutableRefObject<boolean>;
  startNewChat: () => void;
  send: (text: string, image?: string) => Promise<void>;
};

function patchThread(
  list: ChatThreadSummary[],
  id: string,
  patch: Partial<ChatThreadSummary>
): ChatThreadSummary[] {
  return list.map((t) => (t.id === id ? { ...t, ...patch } : t));
}

export function useStudyAiThreadActions({
  threads,
  threadMeta,
  setThreads,
  setThreadMeta,
  setTitle,
  setMessages,
  setError,
  setQueue,
  setLoading,
  setStatusEvents,
  setLiveCitations,
  queueRef,
  activeIdRef,
  abortRef,
  streamingRef,
  startNewChat,
  send,
}: Args) {
  const removeThread = useCallback(
    (id: string) => {
      const snapshot = threads.find((t) => t.id === id);
      setThreads((prev) => prev.filter((t) => t.id !== id));
      if (activeIdRef.current === id) startNewChat();

      void api.study.deleteChat(id).catch(() => {
        if (snapshot) {
          setThreads((prev) =>
            prev.some((t) => t.id === id) ? prev : [snapshot, ...prev]
          );
        }
        setError("Could not delete chat");
      });
    },
    [threads, setThreads, activeIdRef, startNewChat, setError]
  );

  const togglePinThread = useCallback(
    (id: string) => {
      const current = threads.find((t) => t.id === id);
      if (!current) return;
      const nextPinned = !current.pinnedAt;
      const optimisticAt = nextPinned ? new Date().toISOString() : null;
      const prevAt = current.pinnedAt;

      setThreads((prev) =>
        patchThread(prev, id, { pinnedAt: optimisticAt })
      );
      setThreadMeta((meta) =>
        meta?.id === id ? { ...meta, pinnedAt: optimisticAt } : meta
      );

      void api.study
        .updateChat(id, { pinned: nextPinned })
        .then(({ thread }) => {
          setThreads((prev) =>
            prev.map((t) => (t.id === id ? { ...t, ...thread } : t))
          );
          setThreadMeta((meta) =>
            meta?.id === id ? { ...meta, ...thread } : meta
          );
        })
        .catch((err) => {
          setThreads((prev) => patchThread(prev, id, { pinnedAt: prevAt }));
          setThreadMeta((meta) =>
            meta?.id === id ? { ...meta, pinnedAt: prevAt } : meta
          );
          setError(
            err instanceof Error && err.message
              ? err.message
              : "Could not update pin"
          );
        });
    },
    [threads, setThreads, setThreadMeta, setError]
  );

  const renameThread = useCallback(
    (id: string, title: string) => {
      const next = title.trim().slice(0, 120);
      if (!next) return false;
      const current = threads.find((t) => t.id === id);
      const prevTitle = current?.title ?? threadMeta?.title ?? "";

      setThreads((prev) => patchThread(prev, id, { title: next }));
      setThreadMeta((meta) =>
        meta?.id === id ? { ...meta, title: next } : meta
      );
      if (activeIdRef.current === id) setTitle(next);

      void api.study
        .updateChat(id, { title: next })
        .then(({ thread }) => {
          setThreads((prev) =>
            prev.map((t) => (t.id === id ? { ...t, ...thread } : t))
          );
          setThreadMeta((meta) =>
            meta?.id === id ? { ...meta, ...thread } : meta
          );
          if (activeIdRef.current === id) setTitle(thread.title);
        })
        .catch(() => {
          setThreads((prev) => patchThread(prev, id, { title: prevTitle }));
          setThreadMeta((meta) =>
            meta?.id === id ? { ...meta, title: prevTitle } : meta
          );
          if (activeIdRef.current === id) setTitle(prevTitle);
          setError("Could not rename chat");
        });
      return true;
    },
    [
      threads,
      threadMeta,
      setThreads,
      setThreadMeta,
      setTitle,
      activeIdRef,
      setError,
    ]
  );

  const deleteMessage = useCallback(
    (id: string) => {
      const chatId = activeIdRef.current;
      if (!chatId || id.startsWith("tmp-")) return;

      let snapshot: WorkspaceMessage[] | null = null;
      setMessages((prev) => {
        snapshot = prev;
        const idx = prev.findIndex((m) => m.id === id);
        if (idx < 0) return prev;
        const drop = new Set([id]);
        if (prev[idx].role === "user" && prev[idx + 1]?.role === "assistant") {
          drop.add(prev[idx + 1].id);
        }
        return prev.filter((m) => !drop.has(m.id));
      });

      void api.study.deleteChatMessage(chatId, id).catch(() => {
        if (snapshot) setMessages(snapshot);
        setError("Could not delete message");
      });
    },
    [activeIdRef, setMessages, setError]
  );

  const editAndResubmit = useCallback(
    async (messageId: string, text: string) => {
      const chatId = activeIdRef.current;
      const next = text.trim();
      if (!chatId || !next || messageId.startsWith("tmp-")) return;

      abortRef.current?.abort();
      streamingRef.current = false;
      queueRef.current = [];
      setQueue([]);
      setLoading(false);
      setStatusEvents([]);
      setLiveCitations(undefined);
      setError("");

      let snapshot: WorkspaceMessage[] | null = null;
      setMessages((prev) => {
        snapshot = prev;
        const idx = prev.findIndex((m) => m.id === messageId);
        if (idx < 0) return prev;
        return prev.slice(0, idx);
      });

      try {
        await api.study.truncateChatMessages(chatId, { messageId });
      } catch {
        if (snapshot) setMessages(snapshot);
        setError("Could not edit message");
        return;
      }

      await send(next);
    },
    [
      activeIdRef,
      abortRef,
      streamingRef,
      queueRef,
      setQueue,
      setLoading,
      setStatusEvents,
      setLiveCitations,
      setError,
      setMessages,
      send,
    ]
  );

  return {
    removeThread,
    togglePinThread,
    renameThread,
    deleteMessage,
    editAndResubmit,
  };
}
