"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { CitationList } from "@/components/study-ai/CitationList";
import { CopyMessageButton } from "@/components/study-ai/CopyMessageButton";
import { SaveAnswerModal } from "@/components/study-ai/SaveAnswerModal";
import {
  StreamActivity,
  type StreamStatusEvent,
} from "@/components/study-ai/StreamActivity";
import { StudySourcesModal } from "@/components/study-ai/StudySourcesModal";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { downloadChatPdf } from "@/lib/exportAnswer";
import { takeStudyAiPending, hasStudyAiPending, STUDY_AI_NEW_THREAD } from "@/lib/studyAiPending";
import { StudyAIContent } from "@/lib/studyAiMarkdown";
import { isPremiumUser } from "@/lib/premium";
import { normalizeContextKind } from "@/lib/studyAiContextLabel";
import {
  filterThreads,
  groupThreadsByDate,
} from "@/lib/studyAiThreadGroups";
import { ChatMessage, ChatThreadSummary, LibraryCitation } from "@/types";
import {
  ArrowUp,
  Bookmark,
  Download,
  Library,
  MoreHorizontal,
  Paperclip,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Square,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { ThinkingIndicator } from "@/components/GreetingAccent";
import { GreetingBlock } from "@/components/GreetingBlock";
import { LivelyLine } from "@/components/LivelyLine";
import { ShelfLogo } from "@/components/ShelfLogo";

const SUGGESTIONS = [
  "Summarize what I studied this week",
  "Quiz me on my latest notes",
  "Key terms I should revise",
  "Make a revision plan from my collections",
];

type WorkspaceMessage = ChatMessage & { streaming?: boolean };

type PopoverKind = "attach" | "chat" | null;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read image"));
    reader.readAsDataURL(file);
  });
}

function asChatMessage(value: unknown): ChatMessage | null {
  if (!value || typeof value !== "object") return null;
  const rec = value as Partial<ChatMessage>;
  if (!rec.id || !rec.role || typeof rec.content !== "string") return null;
  return rec as ChatMessage;
}

function asCitations(value: unknown): LibraryCitation[] | undefined {
  if (!Array.isArray(value) || value.length === 0) return undefined;
  return value as LibraryCitation[];
}

function threadSidebarMeta(t: ChatThreadSummary): string | null {
  if (t.relevancyDoc?.title) return t.relevancyDoc.title;
  if (normalizeContextKind(t.contextKind) !== "LIBRARY") return "Library scope";
  return null;
}

function positionPopover(menu: HTMLElement, anchor: HTMLElement) {
  const r = anchor.getBoundingClientRect();
  const m = menu.getBoundingClientRect();
  const gap = 8;
  const edge = 12;

  let left = r.left;
  if (left + m.width > window.innerWidth - edge) {
    left = window.innerWidth - m.width - edge;
  }
  if (left < edge) left = edge;

  const roomBelow = window.innerHeight - r.bottom;
  const roomAbove = r.top;

  let top: number;
  if (roomBelow >= m.height + gap) {
    top = r.bottom + gap;
  } else if (roomAbove >= m.height + gap) {
    top = r.top - m.height - gap;
  } else {
    top = Math.max(edge, window.innerHeight - m.height - edge);
  }

  menu.style.left = `${left}px`;
  menu.style.top = `${top}px`;
}

export function StudyAIWorkspace({ threadId }: { threadId?: string }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const memoryLimit = isPremiumUser(user) ? 300 : 30;
  const [threads, setThreads] = useState<ChatThreadSummary[]>([]);
  const [threadsLoading, setThreadsLoading] = useState(true);
  const [threadLoading, setThreadLoading] = useState(Boolean(threadId));
  const [activeId, setActiveId] = useState(threadId);
  const [threadMeta, setThreadMeta] = useState<ChatThreadSummary | null>(null);
  const [messages, setMessages] = useState<WorkspaceMessage[]>([]);
  const [title, setTitle] = useState("Study AI");
  const [input, setInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [attachImage, setAttachImage] = useState<string | undefined>();
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const sourcesActive =
    Boolean(threadMeta?.relevancyDocId) ||
    normalizeContextKind(threadMeta?.contextKind) !== "LIBRARY";
  const [statusEvents, setStatusEvents] = useState<StreamStatusEvent[]>([]);
  const [liveCitations, setLiveCitations] = useState<
    LibraryCitation[] | undefined
  >();
  const [error, setError] = useState("");
  const [saveContent, setSaveContent] = useState<string | null>(null);
  const [exportingChat, setExportingChat] = useState(false);
  const [popover, setPopover] = useState<PopoverKind>(null);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [chatMenuThreadId, setChatMenuThreadId] = useState<string | null>(
    null
  );
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const streamingRef = useRef(false);
  const pendingSentRef = useRef<string | null>(null);
  const attachBtnRef = useRef<HTMLButtonElement>(null);
  const headerMoreRef = useRef<HTMLButtonElement>(null);
  const attachMenuRef = useRef<HTMLDivElement>(null);
  const chatMenuRef = useRef<HTMLDivElement>(null);
  const chatMenuAnchorRef = useRef<HTMLElement | null>(null);

  const refreshThreads = useCallback(() => {
    return api.study
      .listChats()
      .then(({ threads: list }) => setThreads(list))
      .catch(() => {});
  }, []);

  const contextChips = useMemo(() => {
    const chips: { key: string; label: string; onRemove: () => void }[] = [];
    if (threadMeta?.relevancyDoc?.title) {
      chips.push({
        key: "relevancy",
        label: threadMeta.relevancyDoc.title,
        onRemove: () => {
          if (!activeId) return;
          void api.study
            .updateChat(activeId, { relevancyDocId: null })
            .then(({ thread }) => {
              setThreadMeta(thread);
              refreshThreads();
            })
            .catch(() => setError("Could not remove source"));
        },
      });
    }
    if (
      threadMeta &&
      normalizeContextKind(threadMeta.contextKind) !== "LIBRARY"
    ) {
      chips.push({
        key: "scope",
        label: "Library scope",
        onRemove: () => {
          if (!activeId) return;
          void api.study
            .updateChat(activeId, {
              contextKind: "LIBRARY",
              contextNotebookId: null,
              contextTopicId: null,
              contextPageId: null,
            })
            .then(({ thread }) => {
              setThreadMeta(thread);
              refreshThreads();
            })
            .catch(() => setError("Could not remove scope"));
        },
      });
    }
    return chips;
  }, [threadMeta, activeId, refreshThreads]);

  const filteredGroups = useMemo(
    () => groupThreadsByDate(filterThreads(threads, searchQuery)),
    [threads, searchQuery]
  );

  const closePopover = useCallback(() => {
    setPopover(null);
    setChatMenuThreadId(null);
    chatMenuAnchorRef.current = null;
  }, []);

  const openPopover = useCallback(
    (kind: PopoverKind, anchor: HTMLElement, menuThreadId?: string) => {
      setPopover(kind);
      if (menuThreadId) setChatMenuThreadId(menuThreadId);
      chatMenuAnchorRef.current = anchor;
    },
    []
  );

  useLayoutEffect(() => {
    if (popover === null) return;
    const menu =
      popover === "attach" ? attachMenuRef.current : chatMenuRef.current;
    const anchor = chatMenuAnchorRef.current;
    if (!menu || !anchor) return;
    positionPopover(menu, anchor);
  }, [popover]);

  useEffect(() => {
    if (popover === null) return;
    const onDocClick = () => closePopover();
    // Defer so the opening click does not immediately close the menu.
    const timer = window.setTimeout(() => {
      document.addEventListener("click", onDocClick);
    }, 0);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("click", onDocClick);
    };
  }, [popover, closePopover]);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user?.id) return;
    setError("");
    void refreshThreads().finally(() => setThreadsLoading(false));
  }, [user?.id, refreshThreads]);

  useEffect(() => {
    if (!user?.id || !threadId) {
      if (!streamingRef.current && !hasStudyAiPending(STUDY_AI_NEW_THREAD)) {
        setMessages([]);
        setTitle("Study AI");
        setActiveId(undefined);
        setThreadMeta(null);
        setThreadLoading(false);
      }
      return;
    }
    setActiveId(threadId);
    setMessages([]);
    setThreadLoading(true);
    api.study
      .getChat(threadId)
      .then(({ thread }) => {
        if (streamingRef.current) return;
        setMessages(thread.messages);
        setTitle(thread.title);
        setThreadMeta(thread);
      })
      .catch(() => setError("Could not load this chat"))
      .finally(() => setThreadLoading(false));
  }, [user?.id, threadId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading, statusEvents]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const send = useCallback(
    async (text: string, imageOverride?: string) => {
      const q = text.trim();
      const image = imageOverride ?? attachImage;
      if ((!q && !image) || streamingRef.current) return;

      const ac = new AbortController();
      abortRef.current = ac;
      streamingRef.current = true;

      setInput("");
      setAttachImage(undefined);
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
          threadId: activeId ?? "pending",
          role: "user",
          content: userContent,
          createdAt: stamp,
        },
        {
          id: assistantTmpId,
          threadId: activeId ?? "pending",
          role: "assistant",
          content: "",
          createdAt: stamp,
          streaming: true,
        },
      ]);

      try {
        let chatId = activeId;
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
            const userMsg = asChatMessage(meta.userMessage);
            const assistantMsg = asChatMessage(meta.assistantMessage);
            const nextTitle =
              typeof meta.title === "string" ? meta.title : undefined;
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
                prev.find(
                  (m) => m.id === assistantTmpId && m.content.trim()
                );
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
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantTmpId ? { ...m, streaming: false } : m
            )
          );
        } else {
          setError(err instanceof Error ? err.message : "Study AI failed");
          setMessages((prev) => {
            const assistant = prev.find((m) => m.id === assistantTmpId);
            if (!assistant?.content.trim()) {
              return prev.filter(
                (m) => m.id !== userTmpId && m.id !== assistantTmpId
              );
            }
            return prev.map((m) =>
              m.id === assistantTmpId ? { ...m, streaming: false } : m
            );
          });
        }
      } finally {
        if (abortRef.current === ac) {
          streamingRef.current = false;
          setLoading(false);
          setStatusEvents([]);
          abortRef.current = null;
        }
      }
    },
    [activeId, attachImage, memoryLimit, refreshThreads]
  );

  useEffect(() => {
    if (!user?.id) return;
    const pendingId = threadId ?? STUDY_AI_NEW_THREAD;
    if (pendingSentRef.current === pendingId) return;
    const pending = takeStudyAiPending(pendingId);
    if (!pending) return;
    pendingSentRef.current = pendingId;
    void send(pending.text, pending.imageBase64);
  }, [user?.id, threadId, send]);

  const stop = () => {
    abortRef.current?.abort();
  };

  const startNewChat = () => {
    abortRef.current?.abort();
    streamingRef.current = false;
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
  };

  const remove = async (id: string) => {
    closePopover();
    await api.study.deleteChat(id).catch(() => {});
    refreshThreads();
    if (activeId === id) {
      startNewChat();
    }
  };

  const exportChat = async () => {
    const transcript = messages.filter(
      (m) => !m.streaming && m.content.trim().length > 0
    );
    if (transcript.length === 0 || exportingChat) return;
    setExportingChat(true);
    setError("");
    try {
      await downloadChatPdf(title, transcript);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not export chat");
    } finally {
      setExportingChat(false);
    }
  };

  const openRename = (threadTitle: string) => {
    closePopover();
    setRenameValue(threadTitle);
    setRenameOpen(true);
  };

  const confirmRename = async () => {
    const next = renameValue.trim();
    const targetId = chatMenuThreadId ?? activeId;
    if (!targetId || !next || renaming) return;
    setRenaming(true);
    try {
      const { thread } = await api.study.updateChat(targetId, { title: next });
      if (activeId === targetId) setTitle(thread.title);
      refreshThreads();
      setRenameOpen(false);
    } catch {
      setError("Could not rename chat");
    } finally {
      setRenaming(false);
    }
  };

  const showConversationHeader =
    Boolean(activeId) && (messages.length > 0 || threadLoading);

  if (authLoading || !user) {
    return (
      <div className="h-full flex items-center justify-center">
        <ThinkingIndicator label="Loading" />
      </div>
    );
  }

  const empty = messages.length === 0 && !loading && !threadLoading;
  const canExport =
    messages.some((m) => !m.streaming && m.content.trim().length > 0) &&
    !loading;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <Header />
      <div className="flex-1 min-h-0 flex">
        {/* Sidebar */}
        <aside className="study-ai-sidebar hidden sm:flex w-[260px] shrink-0 flex-col border-r border-[var(--border)] bg-[var(--bg-sidebar)]">
          <div className="p-3 shrink-0">
            <button
              type="button"
              onClick={startNewChat}
              className="w-full h-[42px] flex items-center justify-center gap-1.5 text-[12px] font-semibold rounded-[10px] bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--accent)] hover:bg-[var(--accent-subtle)] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              New chat
            </button>

            <div className="mt-2.5 h-9 flex items-center gap-2 px-2.5 rounded-[9px] border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-muted)]">
              <Search className="w-3.5 h-3.5 shrink-0" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chats"
                className="no-focus-ring flex-1 min-w-0 bg-transparent text-[11px] outline-none placeholder:text-[var(--text-muted)]"
              />
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-2 pb-2">
            {threadsLoading && threads.length === 0 && (
              <p className="text-[11px] text-[var(--text-muted)] px-2 py-2">
                Loading…
              </p>
            )}
            {!threadsLoading && threads.length === 0 && (
              <p className="text-[11px] text-[var(--text-muted)] px-2 py-2">
                No chats yet.
              </p>
            )}
            {filteredGroups.map((group) => (
                <div key={group.label} className="mt-4 first:mt-1">
                  <div className="text-[9.5px] font-bold uppercase tracking-wider text-[var(--text-muted)] px-1.5 pb-1.5">
                    {group.label}
                  </div>
                  <ul className="space-y-0.5">
                    {group.threads.map((t) => {
                      const meta = threadSidebarMeta(t);
                      return (
                        <li key={t.id}>
                          <div
                            className={`group flex items-start gap-1 min-h-[44px] px-1.5 py-1.5 rounded-[9px] transition-colors ${
                              activeId === t.id
                                ? "bg-[var(--bg-elevated)] text-[var(--text-primary)]"
                                : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]/70"
                            }`}
                          >
                            <Link
                              href={`/study-ai/${t.id}`}
                              className="flex-1 min-w-0"
                            >
                              <span className="block text-[11.5px] font-semibold truncate">
                                {t.title}
                              </span>
                              {meta && (
                                <span className="mt-0.5 flex items-center gap-1 text-[8.8px] text-[var(--text-muted)] truncate">
                                  <Paperclip className="w-2.5 h-2.5 shrink-0" />
                                  {meta}
                                </span>
                              )}
                            </Link>
                            <button
                              type="button"
                              aria-label="Chat options"
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => {
                                e.stopPropagation();
                                openPopover("chat", e.currentTarget, t.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 w-6 h-6 shrink-0 rounded-md text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center transition-opacity"
                            >
                              <MoreHorizontal className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
          </div>

          <p className="shrink-0 px-3 py-3 border-t border-[var(--border)] text-[9px] text-[var(--text-muted)] leading-snug">
            Chat titles are generated automatically. Rename them anytime.
          </p>
        </aside>

        {/* Main */}
        <main className="flex-1 min-h-0 flex flex-col bg-[var(--bg-primary)]">
          {showConversationHeader && (
            <div className="shrink-0 h-[58px] border-b border-[var(--border)] bg-[var(--bg-primary)]/95 flex items-center px-5 sm:px-6 gap-2.5">
              <div className="min-w-0">
                <div className="text-[13px] font-bold truncate">{title}</div>
                <div className="text-[9.5px] text-[var(--text-muted)] mt-0.5">
                  Conversation
                </div>
              </div>
              <div className="ml-auto flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={!canExport || exportingChat}
                  onClick={() => void exportChat()}
                  className="h-8 flex items-center gap-1.5 px-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] text-[10.5px] font-semibold text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--accent)] hover:bg-[var(--accent-subtle)] disabled:opacity-50 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  {exportingChat ? "Exporting…" : "Download"}
                </button>
                <button
                  ref={headerMoreRef}
                  type="button"
                  aria-label="More chat options"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    openPopover("chat", e.currentTarget, activeId ?? undefined);
                  }}
                  className="w-[34px] h-[34px] rounded-[9px] text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] flex items-center justify-center"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-7 py-6 sm:py-8">
            <div className="max-w-[820px] mx-auto space-y-7">
              {threadLoading && messages.length === 0 && (
                <div className="flex justify-center items-center min-h-[min(40vh,22rem)]">
                  <ThinkingIndicator label="Loading" />
                </div>
              )}

              {empty && (
                <div className="study-ai-empty flex flex-col items-center justify-center text-center min-h-[min(48vh,26rem)] py-10">
                  <div className="study-ai-empty-glow" aria-hidden />
                  <ShelfLogo size={44} className="relative" />
                  {user.name ? (
                    <div className="mt-6 relative">
                      <GreetingBlock
                        name={user.name}
                        size="md"
                        align="center"
                        showAccent={false}
                        animatedDots
                        showSubtitle={false}
                      />
                    </div>
                  ) : (
                    <h1 className="mt-6 page-title relative">Study AI</h1>
                  )}
                  <LivelyLine
                    surface="studyAi"
                    className="mt-5 text-sm text-[var(--text-muted)] max-w-lg px-4 text-center leading-snug"
                  />
                  <div className="relative mt-8 flex flex-wrap justify-center gap-2 max-w-sm">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => void send(s)}
                        className="study-ai-chip text-left text-[13px] px-3 py-1.5 rounded-full border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--accent-subtle)] hover:border-[var(--accent)] hover:text-[var(--text-primary)]"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m) =>
                m.role === "user" ? (
                  <div key={m.id} className="study-ai-msg flex justify-end">
                    <div className="max-w-[72%] rounded-2xl rounded-br-md bg-[var(--accent)] text-white px-4 py-3 text-[13px] whitespace-pre-wrap leading-relaxed">
                      {m.content}
                    </div>
                  </div>
                ) : (
                  <div
                    key={m.id}
                    className="study-ai-msg grid grid-cols-[30px_minmax(0,1fr)] gap-3"
                  >
                    <div className="w-[30px] h-[30px] rounded-lg bg-[var(--accent-subtle)] flex items-center justify-center shrink-0">
                      <ShelfLogo size={18} />
                    </div>
                    <div className="min-w-0 max-w-[92%] rounded-2xl rounded-bl-md border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3">
                      <p className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-[var(--text-muted)] mb-2">
                        {m.streaming ? (
                          <span className="study-ai-live-dot" aria-hidden />
                        ) : (
                          <Sparkles className="w-3 h-3" />
                        )}
                        Study AI
                        {m.streaming ? " · live" : ""}
                      </p>
                      {m.content ? (
                        <StudyAIContent
                          content={m.content}
                          streaming={m.streaming}
                        />
                      ) : (
                        <StreamActivity
                          events={statusEvents}
                          live={Boolean(m.streaming)}
                        />
                      )}
                      {m.streaming && m.content && statusEvents.length > 0 && (
                        <p className="mt-2 text-[11px] text-[var(--text-muted)]">
                          {statusEvents[statusEvents.length - 1]?.detail}
                        </p>
                      )}
                      {!m.streaming && m.content && (
                        <div className="mt-2.5 flex flex-wrap items-center gap-1">
                          <CopyMessageButton text={m.content} variant="action" />
                          <button
                            type="button"
                            onClick={() => setSaveContent(m.content)}
                            className="inline-flex items-center gap-1.5 h-[29px] px-2 rounded-[7px] text-[10px] text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors"
                          >
                            <Bookmark className="w-3 h-3" />
                            Save
                          </button>
                        </div>
                      )}
                      <CitationList
                        citations={
                          m.citations ??
                          (m.streaming ? liveCitations : undefined)
                        }
                        variant="sources-used"
                      />
                    </div>
                  </div>
                )
              )}
              {error && <p className="text-sm text-red-400">{error}</p>}
              <div ref={endRef} />
            </div>
          </div>

          {/* Composer */}
          <div className="study-ai-composer-shell shrink-0 border-t border-[var(--border-subtle)] px-4 sm:px-7 pb-4 pt-3">
            <div className="max-w-[820px] mx-auto">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void send(input);
                }}
              >
                {contextChips.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {contextChips.map((chip) => (
                      <span
                        key={chip.key}
                        className="study-ai-context-chip inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[9px] font-semibold"
                      >
                        {chip.label}
                        <button
                          type="button"
                          aria-label={`Remove ${chip.label}`}
                          onClick={chip.onRemove}
                          className="no-focus-ring leading-none opacity-70 hover:opacity-100"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {attachImage && (
                  <div className="mb-2 relative inline-block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={attachImage}
                      alt="Attachment preview"
                      className="h-16 rounded-lg border border-[var(--border)]"
                    />
                    <button
                      type="button"
                      aria-label="Remove image"
                      onClick={() => setAttachImage(undefined)}
                      className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2 h-14 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] pl-3 pr-2.5 shadow-[0_6px_22px_rgba(var(--shadow-color)/0.05)] transition-shadow focus-within:border-[var(--accent)] focus-within:shadow-[0_0_0_3px_var(--ring)]">
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
                    ref={attachBtnRef}
                    type="button"
                    disabled={loading}
                    aria-label="Attach"
                    title="Attach"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      openPopover("attach", e.currentTarget);
                    }}
                    className="no-focus-ring w-9 h-9 shrink-0 rounded-[9px] border border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-primary)] flex items-center justify-center hover:border-[var(--accent)] hover:bg-[var(--accent-subtle)] hover:text-[var(--accent)] disabled:opacity-40 transition-colors"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    aria-label="Sources"
                    title="Sources"
                    onClick={() => setSourcesOpen(true)}
                    className={`no-focus-ring relative w-9 h-9 shrink-0 rounded-[9px] border flex items-center justify-center disabled:opacity-40 transition-colors ${
                      sourcesActive
                        ? "border-[var(--accent)] text-[var(--accent)] bg-[var(--accent-subtle)]"
                        : "border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:border-[var(--accent)] hover:bg-[var(--accent-subtle)] hover:text-[var(--accent)]"
                    }`}
                  >
                    <Library className="w-4 h-4" />
                    {sourcesActive && (
                      <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                    )}
                  </button>
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Message Study AI…"
                    className="no-focus-ring flex-1 min-w-0 bg-transparent text-[12px] outline-none placeholder:text-[var(--text-muted)] py-2"
                  />
                  {loading ? (
                    <button
                      type="button"
                      onClick={stop}
                      className="no-focus-ring w-[34px] h-[34px] shrink-0 rounded-full bg-[var(--bg-secondary)] text-[var(--text-primary)] border border-[var(--border)] flex items-center justify-center hover:border-[var(--accent)]"
                      aria-label="Stop generating"
                    >
                      <Square className="w-3 h-3 fill-current" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={!input.trim() && !attachImage}
                      className="no-focus-ring w-[34px] h-[34px] shrink-0 rounded-full bg-[var(--accent)] text-white flex items-center justify-center disabled:opacity-40 hover:bg-[var(--accent-hover)] transition-colors"
                      aria-label="Send"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="text-center text-[9px] text-[var(--text-muted)] mt-2 leading-snug">
                  Attach material only when you want Study AI to focus on something
                  specific.
                  <span className="mx-1.5 opacity-35">·</span>
                  Memory last {memoryLimit}
                  <span className="mx-1.5 opacity-35">·</span>
                  {isPremiumUser(user) ? "Premium" : "Free"}
                </p>
              </form>
            </div>
          </div>
        </main>
      </div>

      {/* Attach popover */}
      <div
        ref={attachMenuRef}
        className={`study-ai-popover ${popover === "attach" ? "open" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="study-ai-popover-label">Attach to chat</div>
        <button
          type="button"
          onClick={() => {
            closePopover();
            setSourcesOpen(true);
          }}
        >
          <span className="study-ai-popicon">
            <Library className="w-3.5 h-3.5" />
          </span>
          <span className="study-ai-popcopy">
            <strong>From Library</strong>
            <span>Choose an existing file, topic or collection</span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => {
            closePopover();
            fileRef.current?.click();
          }}
        >
          <span className="study-ai-popicon">
            <Upload className="w-3.5 h-3.5" />
          </span>
          <span className="study-ai-popcopy">
            <strong>Upload from device</strong>
            <span>PDF, DOCX, image, TXT and more</span>
          </span>
        </button>
      </div>

      {/* Chat menu popover */}
      <div
        ref={chatMenuRef}
        className={`study-ai-popover ${popover === "chat" ? "open" : ""}`}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => {
            const target = threads.find(
              (t) => t.id === (chatMenuThreadId ?? activeId)
            );
            openRename(target?.title ?? title);
          }}
        >
          <span className="study-ai-popicon">
            <Pencil className="w-3.5 h-3.5" />
          </span>
          <span className="study-ai-popcopy">
            <strong>Rename</strong>
          </span>
        </button>
        <div className="study-ai-pop-divider" />
        <button
          type="button"
          className="danger"
          onClick={() => {
            const id = chatMenuThreadId ?? activeId;
            if (id) void remove(id);
          }}
        >
          <span className="study-ai-popicon">
            <Trash2 className="w-3.5 h-3.5" />
          </span>
          <span className="study-ai-popcopy">
            <strong>Delete</strong>
          </span>
        </button>
      </div>

      {/* Rename modal */}
      {renameOpen && (
        <div
          className="fixed inset-0 z-[75] flex items-center justify-center bg-black/45 p-5"
          onClick={() => setRenameOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-[var(--border)] flex items-start justify-between gap-4">
              <div>
                <div className="text-lg font-bold">Rename chat</div>
                <div className="text-[10.5px] text-[var(--text-muted)] mt-0.5">
                  Give this conversation a memorable title.
                </div>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setRenameOpen(false)}
                className="w-8 h-8 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-secondary)]"
              >
                <X className="w-4 h-4 mx-auto" />
              </button>
            </div>
            <div className="px-5 py-4">
              <input
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                autoFocus
                className="w-full px-3 py-2 text-sm rounded-[10px] bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-primary)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--ring)]"
                onKeyDown={(e) => {
                  if (e.key === "Enter") void confirmRename();
                }}
              />
            </div>
            <div className="px-5 py-3 border-t border-[var(--border)] flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRenameOpen(false)}
                className="px-3 py-2 text-[10.5px] rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!renameValue.trim() || renaming}
                onClick={() => void confirmRename()}
                className="px-3 py-2 text-[10.5px] font-semibold rounded-lg bg-[var(--accent)] text-white disabled:opacity-50"
              >
                {renaming ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {sourcesOpen && (
        <StudySourcesModal
          threadId={activeId}
          thread={threadMeta}
          onThreadUpdated={(t) => {
            setThreadMeta(t);
            setTitle(t.title);
            setActiveId(t.id);
            refreshThreads();
          }}
          onClose={() => setSourcesOpen(false)}
        />
      )}

      {saveContent && (
        <SaveAnswerModal
          content={saveContent}
          defaultTitle={title === "New chat" ? "Study AI notes" : title}
          onClose={() => setSaveContent(null)}
        />
      )}
    </div>
  );
}
