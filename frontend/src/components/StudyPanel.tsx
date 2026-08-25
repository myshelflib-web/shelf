"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowUp,
  Download,
  ImagePlus,
  ListTree,
  MessageSquareText,
  Network,
  StickyNote,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import { requireOnline } from "@/lib/offline/notice";
import { StudyAIContent } from "@/lib/studyAiMarkdown";
import { isPremiumUser } from "@/lib/premium";
import { useAuth } from "@/hooks/useAuth";
import { GreetingBlock } from "./GreetingBlock";
import { LivelyLine } from "./LivelyLine";
import { CopyMessageButton } from "./study-ai/CopyMessageButton";
import { SaveAnswerModal } from "./study-ai/SaveAnswerModal";
import {
  StreamActivity,
  type StreamStatusEvent,
} from "./study-ai/StreamActivity";

interface StudyPanelProps {
  articleId?: string;
  userTopicId?: string;
  selection?: string | null;
  imageBase64?: string;
  onClearSelection?: () => void;
  onAttachNote?: (note: string) => Promise<void> | void;
  embedMode?: boolean;
  /** Account-only — panel stays visible but controls are muted for guests. */
  guestLocked?: boolean;
  onGuestLockedClick?: (feature: string) => void;
}

type Turn = {
  id: string;
  role: "user" | "assistant";
  content: string;
  imageBase64?: string;
  streaming?: boolean;
};

const ACTIONS: Array<{
  mode: "summarize" | "notes" | "mindmap";
  label: string;
  icon: typeof ListTree;
}> = [
  { mode: "summarize", label: "Summarize", icon: ListTree },
  { mode: "notes", label: "Short notes", icon: StickyNote },
  { mode: "mindmap", label: "Mind map", icon: Network },
];

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read image"));
    reader.readAsDataURL(file);
  });
}

export function StudyPanel({
  articleId,
  userTopicId,
  selection,
  imageBase64,
  onClearSelection,
  onAttachNote,
  embedMode = false,
  guestLocked = false,
  onGuestLockedClick,
}: StudyPanelProps) {
  const { user } = useAuth();
  const memoryLimit = isPremiumUser(user) ? 300 : 30;
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);
  const [statusEvents, setStatusEvents] = useState<StreamStatusEvent[]>([]);
  const [error, setError] = useState("");
  const [attached, setAttached] = useState(false);
  const [pasted, setPasted] = useState("");
  const [attachImage, setAttachImage] = useState<string | undefined>();
  const [saveContent, setSaveContent] = useState<string | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns, busy, statusEvents]);

  useEffect(() => {
    abortRef.current?.abort();
    setTurns([]);
    setError("");
    setBusy(false);
    setStatusEvents([]);
    setSaveContent(null);
    setQuestion("");
    setAttachImage(undefined);
    setThreadId(null);
  }, [user?.id]);

  /** Reopening a document brings back its saved Study AI conversation. */
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
      .catch(() => {
        /* history is a bonus — keep the panel usable */
      })
      .finally(() => {
        if (!cancelled) setRestoring(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userTopicId, user?.id]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const trimMemory = (next: Turn[]) =>
    next.length > memoryLimit ? next.slice(next.length - memoryLimit) : next;

  const run = async (
    mode: "ask" | "summarize" | "notes" | "mindmap",
    q?: string
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
    if (mode === "ask" && !text && !attachImage && !imageBase64) return;
    if (!requireOnline("Study AI")) return;

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setBusy(true);
    setError("");
    setStatusEvents([{ stage: "starting", detail: "Starting Study AI…" }]);
    const userImage = attachImage || imageBase64;
    const userTurn: Turn = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text || "Explain the attached image.",
      imageBase64: userImage,
    };
    const assistantId = `a-${Date.now()}`;
    const historyForApi = turns.map((t) => ({
      role: t.role,
      content: t.content,
      imageBase64: t.imageBase64,
    }));

    setTurns((prev) =>
      trimMemory([
        ...prev,
        userTurn,
        {
          id: assistantId,
          role: "assistant",
          content: "",
          streaming: true,
        },
      ])
    );
    setQuestion("");
    setAttachImage(undefined);
    setAttached(false);

    try {
      await api.study.askStream(
        {
          articleId,
          userTopicId,
          mode,
          question: mode === "ask" ? text : undefined,
          selection: selection || pasted.trim() || undefined,
          imageBase64: userImage,
          history: historyForApi,
          persist: true,
          threadId: threadId ?? undefined,
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
        const empty = next.find((t) => t.id === assistantId && !t.content.trim());
        if (empty) {
          return next.filter((t) => t.id !== assistantId && t.id !== userTurn.id);
        }
        return trimMemory(next);
      });
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Study AI failed");
      setTurns((prev) =>
        prev.filter((t) => t.id !== userTurn.id && t.id !== assistantId)
      );
    } finally {
      setBusy(false);
      setStatusEvents([]);
      if (abortRef.current === ac) abortRef.current = null;
    }
  };

  const canAsk =
    (question.trim().length > 0 || Boolean(attachImage) || Boolean(imageBase64)) &&
    !busy;
  const lastAssistant = [...turns].reverse().find((t) => t.role === "assistant");
  const chatting =
    turns.length > 0 ||
    busy ||
    question.trim().length > 0 ||
    Boolean(attachImage) ||
    Boolean(imageBase64);
  const showGreeting =
    Boolean(guestLocked || user?.name) && !chatting && !restoring;
  const greetingName = user?.name ?? "there";
  const lockedChip =
    "opacity-45 cursor-not-allowed saturate-[0.85] hover:!text-[var(--text-secondary)] hover:!border-[var(--border)]";

  return (
    <div className="flex flex-col min-h-0 h-full">
      {embedMode && (
        <p className="text-[12px] text-[var(--text-secondary)] mb-3 leading-relaxed shrink-0">
          Highlights and sending selected text are not available in embeds. Ask
          about the linked page, or paste a passage below.
        </p>
      )}
      {embedMode && (
        <textarea
          value={pasted}
          onChange={(e) => setPasted(e.target.value)}
          rows={3}
          placeholder="Optional: paste a passage to use as context…"
          className="w-full mb-3 shrink-0 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-[13px] text-[var(--text-primary)] p-3 outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--ring)]"
        />
      )}
      {!embedMode && selection && (
        <div className="mb-3 shrink-0 rounded-xl border border-[var(--border)] bg-[var(--accent-subtle)] px-3 py-2.5">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[10px] uppercase tracking-wide text-[var(--accent)]">
              Highlight
            </span>
            <button
              type="button"
              className="text-[11px] text-[var(--accent)] hover:underline"
              onClick={onClearSelection}
            >
              clear
            </button>
          </div>
          <p className="text-[12px] text-[var(--text-secondary)] leading-relaxed line-clamp-4">
            {selection}
          </p>
        </div>
      )}

      {threadId && (
        <div className="mb-2 shrink-0 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
            <MessageSquareText className="w-3 h-3" />
            Saved to Study AI
          </span>
          <Link
            href={`/study-ai/${threadId}`}
            className="text-[11px] text-[var(--accent)] hover:underline shrink-0"
          >
            Open chat
          </Link>
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto space-y-3 mb-3 pr-0.5">
        {showGreeting && (
          <div className="space-y-2 pt-0.5">
            <GreetingBlock
              name={greetingName}
              size="md"
              align="left"
              showAccent={false}
              animatedDots
              showSubtitle={false}
            />
            <LivelyLine
              surface="studyPanel"
              className="text-[12px] text-[var(--text-muted)] leading-relaxed"
            />
          </div>
        )}
        {!showGreeting && !user?.name && turns.length === 0 && !busy && (
          <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
            {selection
              ? "Highlight is the focus; the full file and your study profile still inform the answer."
              : "Questions use the full file, your library vectors, and study profile."}{" "}
            Keeps the last {memoryLimit} messages (
            {isPremiumUser(user) ? "Premium" : "Free"}).
          </p>
        )}
        {turns.map((t) =>
          t.role === "user" ? (
            <div key={t.id} className="flex justify-end">
              <div className="max-w-[92%] rounded-2xl rounded-br-md bg-[var(--accent)] text-white px-3.5 py-2.5 text-[13px] leading-relaxed">
                {t.imageBase64 && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={t.imageBase64}
                    alt="Attached"
                    className="mb-2 max-h-28 rounded-lg border border-white/20"
                  />
                )}
                <p className="whitespace-pre-wrap">{t.content}</p>
              </div>
            </div>
          ) : (
            <div key={t.id} className="flex justify-start">
              <div className="max-w-[96%] w-full rounded-2xl rounded-bl-md border border-[var(--border)] bg-[var(--bg-secondary)] px-3.5 py-3">
                <p className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-[var(--text-muted)] mb-2">
                  {t.streaming ? (
                    <span className="study-ai-live-dot" aria-hidden />
                  ) : null}
                  Study AI
                  {t.streaming ? " · live" : ""}
                </p>
                {t.content ? (
                  <StudyAIContent content={t.content} streaming={t.streaming} />
                ) : (
                  <StreamActivity
                    events={statusEvents}
                    live={Boolean(t.streaming)}
                  />
                )}
                {t.streaming && t.content && statusEvents.length > 0 && (
                  <p className="mt-2 text-[11px] text-[var(--text-muted)]">
                    {statusEvents[statusEvents.length - 1]?.detail}
                  </p>
                )}
                {!t.streaming && t.content && (
                  <div className="mt-3 flex flex-wrap gap-3">
                    <CopyMessageButton text={t.content} />
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-[11px] text-[var(--accent)] hover:underline"
                      onClick={() => setSaveContent(t.content)}
                    >
                      <Download className="w-3 h-3" />
                      Save / download
                    </button>
                    {onAttachNote && !embedMode && lastAssistant?.id === t.id && (
                      <button
                        type="button"
                        disabled={attached}
                        className="text-[11px] text-[var(--accent)] hover:underline disabled:opacity-60"
                        onClick={async () => {
                          await onAttachNote(t.content);
                          setAttached(true);
                        }}
                      >
                        {attached
                          ? "Saved on highlight"
                          : "Save as note on highlight"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        )}
        {busy && !turns.some((t) => t.streaming) && (
          <StreamActivity events={statusEvents} live />
        )}
        {error && (
          <p className="text-xs text-red-400 leading-relaxed">{error}</p>
        )}
        <div ref={endRef} />
      </div>

      <div className="shrink-0 space-y-3">
        {guestLocked && (
          <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
            Sign in to save chats, highlights, and progress.
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {ACTIONS.map((a) => (
            <button
              key={a.mode}
              type="button"
              disabled={busy}
              aria-disabled={guestLocked}
              onClick={() => void run(a.mode)}
              className={`inline-flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-full border border-[var(--border)] bg-[var(--accent-subtle)] text-[var(--text-secondary)] hover:text-[var(--accent)] hover:border-[var(--accent)] disabled:opacity-50 transition-colors ${
                guestLocked ? lockedChip : ""
              }`}
            >
              <a.icon className="w-3.5 h-3.5" />
              {a.label}
            </button>
          ))}
        </div>

        {(attachImage || imageBase64) && (
          <div className="relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={attachImage || imageBase64}
              alt="Attachment"
              className="h-14 rounded-lg border border-[var(--border)]"
            />
            {attachImage && (
              <button
                type="button"
                aria-label="Remove image"
                onClick={() => setAttachImage(undefined)}
                className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (canAsk) void run("ask", question.trim());
          }}
        >
          <div className="flex items-end gap-2 rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-1.5 focus-within:border-[var(--accent)] focus-within:shadow-[0_0_0_3px_var(--ring)]">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                void readFileAsDataUrl(file)
                  .then(setAttachImage)
                  .catch(() => setError("Could not attach image"));
              }}
            />
            <button
              type="button"
              disabled={busy}
              aria-disabled={guestLocked}
              aria-label="Attach image"
              onClick={() => {
                if (guestLocked) {
                  onGuestLockedClick?.("Use Study AI");
                  return;
                }
                fileRef.current?.click();
              }}
              className={`shrink-0 h-8 w-8 rounded-xl flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--accent-subtle)] disabled:opacity-40 ${
                guestLocked ? lockedChip : ""
              }`}
            >
              <ImagePlus className="w-4 h-4" />
            </button>
            <input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={busy}
              readOnly={guestLocked}
              onFocus={() => {
                if (guestLocked) onGuestLockedClick?.("Use Study AI");
              }}
              placeholder={
                guestLocked
                  ? "Sign in to use Study AI…"
                  : embedMode
                    ? "Ask about this linked page…"
                    : selection
                      ? "Ask about the highlight…"
                      : "Ask about this file…"
              }
              className={`flex-1 min-w-0 bg-transparent px-1 py-2 text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none disabled:opacity-60 ${
                guestLocked ? "cursor-not-allowed opacity-60" : ""
              }`}
            />
            <button
              type="submit"
              disabled={busy || (!guestLocked && !canAsk)}
              aria-label="Ask"
              aria-disabled={guestLocked}
              className={`shrink-0 h-8 w-8 rounded-xl flex items-center justify-center bg-[var(--accent)] text-white disabled:opacity-35 hover:bg-[var(--accent-hover)] transition-colors ${
                guestLocked ? "opacity-45 cursor-not-allowed saturate-[0.85]" : ""
              }`}
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {saveContent && (
        <SaveAnswerModal
          content={saveContent}
          defaultTitle="Study AI notes"
          onClose={() => setSaveContent(null)}
        />
      )}
    </div>
  );
}
