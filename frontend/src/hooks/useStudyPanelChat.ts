"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { requireOnline } from "@/lib/offline/notice";
import type { StreamStatusEvent } from "@/components/study-ai/StreamActivity";
import type { StudyAiQueuedPrompt } from "@/lib/studyAiQueue";
import { enqueuePrompt, takeNextPrompt } from "@/lib/studyAiQueue";

export type StudyPanelTurn = {
  id: string;
  role: "user" | "assistant";
  content: string;
  imageBase64?: string;
  streaming?: boolean;
};

export function useStudyPanelChat({
  articleId,
  userTopicId,
  selection,
  imageBase64,
  guestLocked,
  onGuestLockedClick,
  memoryLimit,
  userId,
}: {
  articleId?: string;
  userTopicId?: string;
  selection?: string | null;
  imageBase64?: string;
  guestLocked?: boolean;
  onGuestLockedClick?: (feature: string) => void;
  memoryLimit: number;
  userId?: string;
}) {
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<StudyPanelTurn[]>([]);
  const [busy, setBusy] = useState(false);
  const [statusEvents, setStatusEvents] = useState<StreamStatusEvent[]>([]);
  const [error, setError] = useState("");
  const [attachImage, setAttachImage] = useState<string | undefined>();
  const [threadId, setThreadId] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [queue, setQueue] = useState<StudyAiQueuedPrompt[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const busyRef = useRef(false);
  const queueRef = useRef<StudyAiQueuedPrompt[]>([]);
  const threadIdRef = useRef<string | null>(null);
  const turnsRef = useRef<StudyPanelTurn[]>([]);
  threadIdRef.current = threadId;
  turnsRef.current = turns;

  const trimMemory = useCallback(
    (next: StudyPanelTurn[]) =>
      next.length > memoryLimit ? next.slice(next.length - memoryLimit) : next,
    [memoryLimit]
  );

  useEffect(() => {
    abortRef.current?.abort();
    if (!userId) {
      setTurns([]);
      setError("");
      setBusy(false);
      busyRef.current = false;
      setStatusEvents([]);
      setQuestion("");
      setAttachImage(undefined);
      setThreadId(null);
      queueRef.current = [];
      setQueue([]);
    }
  }, [userId]);

  useEffect(() => {
    if (!userTopicId) {
      setThreadId(null);
      return;
    }
    let cancelled = false;
    setRestoring(true);
    api.study
      .listChats({ pageId: userTopicId })
      .then(async ({ threads }) => {
        const saved = threads[0];
        if (!saved || cancelled) return;
        const { thread } = await api.study.getChat(saved.id);
        if (cancelled) return;
        setThreadId(thread.id);
        if (busyRef.current || turnsRef.current.length > 0) return;
        setTurns(
          thread.messages
            .filter((m) => m.role === "user" || m.role === "assistant")
            .map((m) => ({
              id: m.id,
              role: m.role as "user" | "assistant",
              content: m.content,
            }))
        );
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setRestoring(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userTopicId, userId]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const run = useCallback(
    async (
      mode: "ask" | "summarize" | "notes" | "mindmap",
      q?: string,
      imageOverride?: string,
      opts?: { skipHistoryImage?: boolean }
    ) => {
      if (guestLocked) {
        onGuestLockedClick?.("Use Study AI");
        return;
      }
      const text =
        mode === "ask"
          ? (q ?? "").trim()
          : mode === "summarize"
            ? "Summarize this"
            : mode === "notes"
              ? "Make short notes"
              : "Make a mind map";
      const userImage = imageOverride ?? attachImage ?? imageBase64;
      if (mode === "ask" && !text && !userImage) return;
      if (!requireOnline("Study AI")) return;

      if (busyRef.current) {
        if (mode === "ask") {
          const next = enqueuePrompt(queueRef.current, text, userImage);
          queueRef.current = next;
          setQueue(next);
        }
        return;
      }

      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      busyRef.current = true;
      setBusy(true);
      setError("");
      setStatusEvents([{ stage: "starting", detail: "Starting Study AI…" }]);
      const userTurn: StudyPanelTurn = {
        id: `u-${Date.now()}`,
        role: "user",
        content: text || "Explain the attached image.",
        imageBase64: opts?.skipHistoryImage ? undefined : userImage,
      };
      const assistantId = `a-${Date.now()}`;
      const historyForApi = turnsRef.current.map((t) => ({
        role: t.role,
        content: t.content,
        imageBase64: t.imageBase64,
      }));

      setTurns((prev) =>
        trimMemory([
          ...prev,
          userTurn,
          { id: assistantId, role: "assistant", content: "", streaming: true },
        ])
      );
      setQuestion("");
      setAttachImage(undefined);

      try {
        await api.study.askStream(
          {
            articleId,
            userTopicId,
            mode,
            question: mode === "ask" ? text || "Explain this." : undefined,
            selection: selection || undefined,
            imageBase64: userImage,
            history: historyForApi,
            persist: true,
            threadId: threadIdRef.current ?? undefined,
          },
          {
            signal: ac.signal,
            onStatus: (stage, detail) => {
              const line = detail || "Working…";
              setStatusEvents((prev) => {
                if (prev[prev.length - 1]?.detail === line) return prev;
                return [...prev, { stage: stage || "status", detail: line }];
              });
            },
            onDelta: (piece) => {
              setTurns((prev) =>
                prev.map((t) =>
                  t.id === assistantId
                    ? { ...t, content: t.content + piece, streaming: true }
                    : t
                )
              );
            },
            onDone: (meta) => {
              const savedThread = meta?.threadId;
              if (typeof savedThread === "string") setThreadId(savedThread);
              setTurns((prev) =>
                prev.map((t) =>
                  t.id === assistantId ? { ...t, streaming: false } : t
                )
              );
            },
          }
        );
        setTurns((prev) => {
          const next = prev.map((t) =>
            t.id === assistantId ? { ...t, streaming: false } : t
          );
          return trimMemory(next);
        });
      } catch (err) {
        if ((err as Error)?.name === "AbortError") {
          setTurns((prev) => {
            const assistant = prev.find((t) => t.id === assistantId);
            if (!assistant?.content.trim()) {
              return prev.filter((t) => t.id !== assistantId);
            }
            return prev.map((t) =>
              t.id === assistantId ? { ...t, streaming: false } : t
            );
          });
        } else {
          setError(err instanceof Error ? err.message : "Study AI failed");
          setTurns((prev) =>
            prev.map((t) =>
              t.id === assistantId
                ? {
                    ...t,
                    streaming: false,
                    content:
                      t.content.trim() ||
                      "Study AI could not finish this reply.",
                  }
                : t
            )
          );
        }
      } finally {
        if (abortRef.current === ac) {
          busyRef.current = false;
          setBusy(false);
          setStatusEvents([]);
          abortRef.current = null;
          const { next, rest } = takeNextPrompt(queueRef.current);
          queueRef.current = rest;
          setQueue(rest);
          if (next) {
            void run("ask", next.text, next.imageBase64);
          }
        }
      }
    },
    [
      articleId,
      userTopicId,
      selection,
      imageBase64,
      attachImage,
      guestLocked,
      onGuestLockedClick,
      trimMemory,
    ]
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const removeQueued = useCallback((id: string) => {
    const next = queueRef.current.filter((item) => item.id !== id);
    queueRef.current = next;
    setQueue(next);
  }, []);

  const deleteTurn = useCallback(
    async (id: string) => {
      const chatId = threadIdRef.current;
      setTurns((prev) => {
        const idx = prev.findIndex((t) => t.id === id);
        if (idx < 0) return prev;
        const drop = new Set([id]);
        if (prev[idx].role === "user" && prev[idx + 1]?.role === "assistant") {
          drop.add(prev[idx + 1].id);
        }
        return prev.filter((t) => !drop.has(t.id));
      });
      if (!chatId || id.startsWith("u-") || id.startsWith("a-")) return;
      try {
        const { deletedIds } = await api.study.deleteChatMessage(chatId, id);
        setTurns((prev) => prev.filter((t) => !deletedIds.includes(t.id)));
      } catch {
        setError("Could not delete message");
      }
    },
    []
  );

  return {
    question,
    setQuestion,
    turns,
    busy,
    statusEvents,
    error,
    setError,
    attachImage,
    setAttachImage,
    threadId,
    restoring,
    queue,
    run,
    stop,
    removeQueued,
    deleteTurn,
  };
}
