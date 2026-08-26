"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  takeStudyAiPending,
  hasStudyAiPending,
  STUDY_AI_NEW_THREAD,
} from "@/lib/studyAiPending";
import type { StreamStatusEvent } from "@/components/study-ai/StreamActivity";
import { ChatThreadSummary, LibraryCitation } from "@/types";
import type { StudyAiQueuedPrompt } from "@/lib/studyAiQueue";
import { enqueuePrompt, takeNextPrompt } from "@/lib/studyAiQueue";
import {
  asChatMessage,
  asCitations,
  type WorkspaceMessage,
} from "@/lib/studyAiWorkspaceUtils";

export function useStudyAiChat({
  threadId,
  userId,
  memoryLimit,
}: {
  threadId?: string;
  userId?: string;
  memoryLimit: number;
}) {
  const router = useRouter();
  const [threads, setThreads] = useState<ChatThreadSummary[]>([]);
  const [threadsLoading, setThreadsLoading] = useState(true);
  const [threadLoading, setThreadLoading] = useState(Boolean(threadId));
  const [activeId, setActiveId] = useState(threadId);
  const [threadMeta, setThreadMeta] = useState<ChatThreadSummary | null>(null);
  const [messages, setMessages] = useState<WorkspaceMessage[]>([]);
  const [title, setTitle] = useState("Study AI");
  const [loading, setLoading] = useState(false);
  const [statusEvents, setStatusEvents] = useState<StreamStatusEvent[]>([]);
  const [liveCitations, setLiveCitations] = useState<
    LibraryCitation[] | undefined
  >();
  const [error, setError] = useState("");
  const [queue, setQueue] = useState<StudyAiQueuedPrompt[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const streamingRef = useRef(false);
  const pendingSentRef = useRef<string | null>(null);
  const queueRef = useRef<StudyAiQueuedPrompt[]>([]);
  const activeIdRef = useRef(activeId);
  activeIdRef.current = activeId;

  const refreshThreads = useCallback(() => {
    return api.study
      .listChats()
      .then(({ threads: list }) => setThreads(list))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!userId) return;
    setError("");
    void refreshThreads().finally(() => setThreadsLoading(false));
  }, [userId, refreshThreads]);

  useEffect(() => {
    if (!userId || !threadId) {
      if (
        !streamingRef.current &&
        !hasStudyAiPending(STUDY_AI_NEW_THREAD) &&
        !activeIdRef.current
      ) {
        setMessages([]);
        setTitle("Study AI");
        setActiveId(undefined);
        setThreadMeta(null);
        setThreadLoading(false);
      }
      return;
    }
    const switching = Boolean(
      activeIdRef.current && activeIdRef.current !== threadId
    );
    setActiveId(threadId);
    if (!streamingRef.current && switching) {
      setMessages([]);
    }
    if (!streamingRef.current) {
      setThreadLoading(true);
    }
    api.study
      .getChat(threadId)
      .then(({ thread }) => {
        if (streamingRef.current) return;
        setMessages((prev) => {
          if (thread.messages.length === 0 && prev.length > 0) {
            const keepLocal = prev.some(
              (m) =>
                m.threadId === threadId ||
                m.threadId === "pending" ||
                m.id.startsWith("tmp-")
            );
            if (keepLocal) return prev;
          }
          return thread.messages;
        });
        setTitle(thread.title);
        setThreadMeta(thread);
      })
      .catch(() => setError("Could not load this chat"))
      .finally(() => setThreadLoading(false));
  }, [userId, threadId]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const send = useCallback(
    async (text: string, imageOverride?: string) => {
      const q = text.trim();
      const image = imageOverride;
      if (!q && !image) return;

      if (streamingRef.current) {
        const next = enqueuePrompt(queueRef.current, q, image);
        queueRef.current = next;
        setQueue(next);
        return;
      }

      const ac = new AbortController();
      abortRef.current = ac;
      streamingRef.current = true;

      setError("");
      setLoading(true);
      setStatusEvents([{ stage: "starting", detail: "Starting Study AI…" }]);
      setLiveCitations(undefined);

      const userContent = q || "📷 [Image attached]";
      const userTmpId = `tmp-u-${Date.now()}`;
      const assistantTmpId = `tmp-a-${Date.now()}`;
      const stamp = new Date().toISOString();

      setMessages((prev) => [
        ...prev,
        {
          id: userTmpId,
          threadId: activeIdRef.current ?? "pending",
          role: "user",
          content: userContent,
          createdAt: stamp,
        },
        {
          id: assistantTmpId,
          threadId: activeIdRef.current ?? "pending",
          role: "assistant",
          content: "",
          createdAt: stamp,
          streaming: true,
        },
      ]);

      try {
        let chatId = activeIdRef.current;
        if (!chatId) {
          const { thread } = await api.study.createChat({ title: "New chat" });
          chatId = thread.id;
          setActiveId(chatId);
          setThreadMeta(thread);
          window.history.replaceState(null, "", `/study-ai/${chatId}`);
          refreshThreads();
        }

        await api.study.sendChatMessageStream(chatId, q || "Explain this image", {
          imageBase64: image,
          signal: ac.signal,
          onStatus: (_stage, detail, extra) => {
            const line = detail || "Working…";
            setStatusEvents((prev) => {
              if (prev[prev.length - 1]?.detail === line) return prev;
              return [...prev, { stage: _stage || "status", detail: line }];
            });
            const cites = asCitations(extra?.citations);
            if (cites) setLiveCitations(cites);
          },
          onDelta: (piece) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantTmpId
                  ? { ...m, content: m.content + piece, streaming: true }
                  : m
              )
            );
          },
          onDone: (meta) => {
            if (typeof meta.threadId === "string") setActiveId(meta.threadId);
            const userMsg = asChatMessage(meta.userMessage);
            const assistantMsg = asChatMessage(meta.assistantMessage);
            const nextTitle =
              typeof meta.title === "string" ? meta.title : undefined;
            if (!userMsg && !assistantMsg && !nextTitle) return;
            const limit =
              typeof meta.memoryLimit === "number"
                ? meta.memoryLimit
                : memoryLimit;
            if (nextTitle) setTitle(nextTitle);
            setMessages((prev) => {
              const withoutTmp = prev.filter(
                (m) => m.id !== userTmpId && m.id !== assistantTmpId
              );
              const streamed =
                assistantMsg ??
                prev.find((m) => m.id === assistantTmpId && m.content.trim());
              const next = [
                ...withoutTmp,
                ...(userMsg ? [userMsg] : []),
                ...(streamed
                  ? [{ ...streamed, streaming: false } as WorkspaceMessage]
                  : []),
              ];
              return next.length > limit
                ? next.slice(next.length - limit)
                : next;
            });
          },
        });
        refreshThreads();
      } catch (err) {
        if ((err as Error)?.name === "AbortError") {
          setMessages((prev) => {
            const assistant = prev.find((m) => m.id === assistantTmpId);
            if (!assistant?.content.trim()) {
              return prev.filter((m) => m.id !== assistantTmpId);
            }
            return prev.map((m) =>
              m.id === assistantTmpId ? { ...m, streaming: false } : m
            );
          });
        } else {
          setError(err instanceof Error ? err.message : "Study AI failed");
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantTmpId
                ? {
                    ...m,
                    streaming: false,
                    content:
                      m.content.trim() ||
                      "Study AI could not finish this reply.",
                  }
                : m
            )
          );
          refreshThreads();
        }
      } finally {
        if (abortRef.current === ac) {
          streamingRef.current = false;
          setLoading(false);
          setStatusEvents([]);
          abortRef.current = null;
          const { next, rest } = takeNextPrompt(queueRef.current);
          queueRef.current = rest;
          setQueue(rest);
          if (next) {
            void send(next.text, next.imageBase64);
          }
        }
      }
    },
    [memoryLimit, refreshThreads]
  );

  useEffect(() => {
    if (!userId) return;
    const pendingId = threadId ?? STUDY_AI_NEW_THREAD;
    if (pendingSentRef.current === pendingId) return;
    const pending = takeStudyAiPending(pendingId);
    if (!pending) return;
    pendingSentRef.current = pendingId;
    void send(pending.text, pending.imageBase64);
  }, [userId, threadId, send]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const removeQueued = useCallback((id: string) => {
    const next = queueRef.current.filter((item) => item.id !== id);
    queueRef.current = next;
    setQueue(next);
  }, []);

  const startNewChat = useCallback(() => {
    abortRef.current?.abort();
    streamingRef.current = false;
    queueRef.current = [];
    setQueue([]);
    setLoading(false);
    setStatusEvents([]);
    setLiveCitations(undefined);
    setMessages([]);
    setTitle("Study AI");
    setError("");
    setActiveId(undefined);
    setThreadMeta(null);
    if (threadId) router.push("/study-ai");
    else window.history.replaceState(null, "", "/study-ai");
  }, [router, threadId]);

  const removeThread = useCallback(
    async (id: string) => {
      await api.study.deleteChat(id).catch(() => {});
      refreshThreads();
      if (activeIdRef.current === id) startNewChat();
    },
    [refreshThreads, startNewChat]
  );

  const deleteMessage = useCallback(
    async (id: string) => {
      const chatId = activeIdRef.current;
      if (!chatId || id.startsWith("tmp-")) return;
      setMessages((prev) => {
        const idx = prev.findIndex((m) => m.id === id);
        if (idx < 0) return prev;
        const drop = new Set([id]);
        if (prev[idx].role === "user" && prev[idx + 1]?.role === "assistant") {
          drop.add(prev[idx + 1].id);
        }
        return prev.filter((m) => !drop.has(m.id));
      });
      try {
        const { deletedIds } = await api.study.deleteChatMessage(chatId, id);
        setMessages((prev) => prev.filter((m) => !deletedIds.includes(m.id)));
      } catch {
        setError("Could not delete message");
        const { thread } = await api.study.getChat(chatId).catch(() => ({
          thread: null,
        }));
        if (thread) setMessages(thread.messages);
      }
    },
    []
  );

  return {
    threads,
    threadsLoading,
    threadLoading,
    activeId,
    setActiveId,
    threadMeta,
    setThreadMeta,
    messages,
    title,
    setTitle,
    loading,
    statusEvents,
    liveCitations,
    error,
    setError,
    queue,
    send,
    stop,
    removeQueued,
    startNewChat,
    removeThread,
    deleteMessage,
    refreshThreads,
  };
}
