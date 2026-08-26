"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { SaveAnswerModal } from "@/components/study-ai/SaveAnswerModal";
import { StudySourcesModal } from "@/components/study-ai/StudySourcesModal";
import { StudyAiSidebar } from "@/components/study-ai/StudyAiSidebar";
import { StudyAiMessageList } from "@/components/study-ai/StudyAiMessageList";
import { StudyAiComposer } from "@/components/study-ai/StudyAiComposer";
import { StudyAiSuggestChips } from "@/components/study-ai/StudyAiSuggestChips";
import { resolveStudyAiInput } from "@/lib/studyAiCommands";
import {
  StudyAiAttachMenu,
  StudyAiChatMenu,
  StudyAiRenameModal,
} from "@/components/study-ai/StudyAiChatMenus";
import { useAuth } from "@/hooks/useAuth";
import { useStudyAiChat } from "@/hooks/useStudyAiChat";
import { api } from "@/lib/api";
import { downloadChatPdf } from "@/lib/exportAnswer";
import { isPremiumUser } from "@/lib/premium";
import { normalizeContextKind } from "@/lib/studyAiContextLabel";
import {
  positionPopover,
  type PopoverKind,
} from "@/lib/studyAiWorkspaceUtils";
import { Download, MoreHorizontal } from "lucide-react";
import { ThinkingIndicator } from "@/components/GreetingAccent";
import { GreetingBlock } from "@/components/GreetingBlock";
import { LivelyLine } from "@/components/LivelyLine";
import { ShelfLogo } from "@/components/ShelfLogo";

export function StudyAIWorkspace({ threadId }: { threadId?: string }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const memoryLimit = isPremiumUser(user) ? 300 : 30;
  const chat = useStudyAiChat({
    threadId,
    userId: user?.id,
    memoryLimit,
  });

  const [input, setInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [attachImage, setAttachImage] = useState<string | undefined>();
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [saveContent, setSaveContent] = useState<string | null>(null);
  const [exportingChat, setExportingChat] = useState(false);
  const [popover, setPopover] = useState<PopoverKind>(null);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [chatMenuThreadId, setChatMenuThreadId] = useState<string | null>(null);

  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const attachBtnRef = useRef<HTMLButtonElement>(null);
  const headerMoreRef = useRef<HTMLButtonElement>(null);
  const attachMenuRef = useRef<HTMLDivElement>(null);
  const chatMenuRef = useRef<HTMLDivElement>(null);
  const chatMenuAnchorRef = useRef<HTMLElement | null>(null);

  const sourcesActive =
    Boolean(chat.threadMeta?.relevancyDocId) ||
    normalizeContextKind(chat.threadMeta?.contextKind) !== "LIBRARY";

  const threadMeta = chat.threadMeta;
  const activeId = chat.activeId;
  const refreshThreads = chat.refreshThreads;
  const setThreadMeta = chat.setThreadMeta;
  const setError = chat.setError;

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
    if (threadMeta && normalizeContextKind(threadMeta.contextKind) !== "LIBRARY") {
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
  }, [threadMeta, activeId, refreshThreads, setThreadMeta, setError]);

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
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [chat.messages, chat.loading, chat.statusEvents]);

  const exportChat = async () => {
    const transcript = chat.messages.filter(
      (m) => !m.streaming && m.content.trim().length > 0
    );
    if (transcript.length === 0 || exportingChat) return;
    setExportingChat(true);
    chat.setError("");
    try {
      await downloadChatPdf(chat.title, transcript);
    } catch (err) {
      chat.setError(err instanceof Error ? err.message : "Could not export chat");
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
    const targetId = chatMenuThreadId ?? chat.activeId;
    if (!targetId || !next || renaming) return;
    setRenaming(true);
    try {
      const { thread } = await api.study.updateChat(targetId, { title: next });
      if (chat.activeId === targetId) chat.setTitle(thread.title);
      chat.refreshThreads();
      setRenameOpen(false);
    } catch {
      chat.setError("Could not rename chat");
    } finally {
      setRenaming(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="h-full flex items-center justify-center">
        <ThinkingIndicator label="Loading" />
      </div>
    );
  }

  const showConversationHeader =
    Boolean(chat.activeId) &&
    (chat.messages.length > 0 || chat.threadLoading);
  const empty =
    chat.messages.length === 0 && !chat.loading && !chat.threadLoading;
  const canExport =
    chat.messages.some((m) => !m.streaming && m.content.trim().length > 0) &&
    !chat.loading;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <Header />
      <div className="flex-1 min-h-0 flex">
        <StudyAiSidebar
          threads={chat.threads}
          threadsLoading={chat.threadsLoading}
          searchQuery={searchQuery}
          onSearchQuery={setSearchQuery}
          activeId={chat.activeId}
          onNewChat={chat.startNewChat}
          onOpenMenu={(el, id) => openPopover("chat", el, id)}
        />

        <main className="flex-1 min-h-0 flex flex-col bg-[var(--bg-primary)]">
          {showConversationHeader && (
            <div className="shrink-0 h-[58px] border-b border-[var(--border)] bg-[var(--bg-primary)]/95 flex items-center px-5 sm:px-6 gap-2.5">
              <div className="min-w-0">
                <div className="text-[13px] font-bold truncate">{chat.title}</div>
                <GreetingBlock
                  name={user.name}
                  size="sm"
                  align="left"
                  showAccent={false}
                  showSubtitle={false}
                  className="mt-0.5 min-w-0 overflow-hidden [&_p]:truncate"
                />
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
                    openPopover("chat", e.currentTarget, chat.activeId);
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
              {chat.threadLoading && chat.messages.length === 0 && (
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
                    <StudyAiSuggestChips
                      scope="library"
                      count={4}
                      onPick={(item) => {
                        const resolved = resolveStudyAiInput(
                          item.insert,
                          "library"
                        );
                        if (
                          resolved.kind === "prompt" ||
                          resolved.kind === "plain"
                        ) {
                          void chat.send(resolved.text);
                        }
                      }}
                    />
                  </div>
                </div>
              )}

              <StudyAiMessageList
                messages={chat.messages}
                statusEvents={chat.statusEvents}
                liveCitations={chat.liveCitations}
                onSave={setSaveContent}
                onDelete={(id) => void chat.deleteMessage(id)}
              />
              {chat.error && <p className="text-sm text-red-400">{chat.error}</p>}
              <div ref={endRef} />
            </div>
          </div>

          <StudyAiComposer
            input={input}
            onInput={setInput}
            attachImage={attachImage}
            onAttachImage={setAttachImage}
            onAttachError={() => chat.setError("Could not attach image")}
            loading={chat.loading}
            queue={chat.queue}
            contextChips={contextChips}
            sourcesActive={sourcesActive}
            onOpenSources={() => setSourcesOpen(true)}
            onOpenAttach={(el) => openPopover("attach", el)}
            attachBtnRef={attachBtnRef}
            fileRef={fileRef}
            onSend={(text, image) => void chat.send(text, image)}
            onStop={chat.stop}
            onRemoveQueued={chat.removeQueued}
            memoryLimit={memoryLimit}
            planLabel={isPremiumUser(user) ? "Premium" : "Free"}
          />
        </main>
      </div>

      <StudyAiAttachMenu
        menuRef={attachMenuRef}
        open={popover === "attach"}
        onClose={closePopover}
        onFromLibrary={() => setSourcesOpen(true)}
        onUpload={() => fileRef.current?.click()}
      />
      <StudyAiChatMenu
        menuRef={chatMenuRef}
        open={popover === "chat"}
        onRename={() => {
          const target = chat.threads.find(
            (t) => t.id === (chatMenuThreadId ?? chat.activeId)
          );
          openRename(target?.title ?? chat.title);
        }}
        onDelete={() => {
          const id = chatMenuThreadId ?? chat.activeId;
          closePopover();
          if (id) void chat.removeThread(id);
        }}
      />

      {renameOpen && (
        <StudyAiRenameModal
          value={renameValue}
          onChange={setRenameValue}
          renaming={renaming}
          onClose={() => setRenameOpen(false)}
          onSave={() => void confirmRename()}
        />
      )}

      {sourcesOpen && (
        <StudySourcesModal
          threadId={chat.activeId}
          thread={chat.threadMeta}
          onThreadUpdated={(t) => {
            chat.setThreadMeta(t);
            chat.setTitle(t.title);
            chat.setActiveId(t.id);
            chat.refreshThreads();
          }}
          onClose={() => setSourcesOpen(false)}
        />
      )}

      {saveContent && (
        <SaveAnswerModal
          content={saveContent}
          defaultTitle={chat.title === "New chat" ? "Study AI notes" : chat.title}
          onClose={() => setSaveContent(null)}
        />
      )}
    </div>
  );
}
