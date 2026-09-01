"use client";

import { Bookmark, Layers, Sparkles } from "lucide-react";
import { StudyAIContent } from "@/lib/studyAiMarkdown";
import { CopyMessageButton } from "@/components/study-ai/CopyMessageButton";
import { DeleteMessageButton } from "@/components/study-ai/DeleteMessageButton";
import { EditUserMessage } from "@/components/study-ai/EditUserMessage";
import { CitationList } from "@/components/study-ai/CitationList";
import {
  StreamActivity,
  type StreamStatusEvent,
} from "@/components/study-ai/StreamActivity";
import { ShelfLogo } from "@/components/ShelfLogo";
import type { WorkspaceMessage } from "@/lib/studyAiWorkspaceUtils";
import { hasFlashcardDeck } from "@/lib/parseFlashcards";
import { LibraryCitation } from "@/types";

export function StudyAiMessageList({
  messages,
  statusEvents,
  liveCitations,
  editingDisabled,
  onSave,
  onDelete,
  onEditResubmit,
  onStudyFlashcards,
}: {
  messages: WorkspaceMessage[];
  statusEvents: StreamStatusEvent[];
  liveCitations?: LibraryCitation[];
  editingDisabled?: boolean;
  onSave: (content: string) => void;
  onDelete: (id: string) => void;
  onEditResubmit: (id: string, content: string) => void;
  onStudyFlashcards: (content: string) => void;
}) {
  return (
    <>
      {messages.map((m) =>
        m.role === "user" ? (
          <div
            key={m.clientKey ?? m.id}
            className="study-ai-msg-user group flex justify-end"
          >
            <div className="max-w-[72%]">
              {m.id.startsWith("tmp-") ? (
                <div className="rounded-2xl rounded-br-md bg-[var(--accent)] text-white px-4 py-3 text-[13px] whitespace-pre-wrap leading-relaxed">
                  {m.content}
                </div>
              ) : (
                <EditUserMessage
                  content={m.content}
                  disabled={editingDisabled}
                  onResubmit={(next) => onEditResubmit(m.id, next)}
                  actions={
                    <DeleteMessageButton
                      onDelete={() => onDelete(m.id)}
                      disabled={editingDisabled}
                    />
                  }
                >
                  <div className="rounded-2xl rounded-br-md bg-[var(--accent)] text-white px-4 py-3 text-[13px] whitespace-pre-wrap leading-relaxed">
                    {m.content}
                  </div>
                </EditUserMessage>
              )}
            </div>
          </div>
        ) : (
          <div
            key={m.clientKey ?? m.id}
            className="study-ai-msg grid grid-cols-[30px_minmax(0,1fr)] gap-3"
          >
            <div className="w-[30px] h-[30px] rounded-lg bg-[var(--accent-subtle)] flex items-center justify-center shrink-0">
              <ShelfLogo size={18} />
            </div>
            <div className="min-w-0 max-w-[92%] rounded-2xl rounded-bl-md border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3">
              <div className="mb-2">
                <p className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-[var(--text-muted)]">
                  {m.streaming ? (
                    <span className="study-ai-live-dot" aria-hidden />
                  ) : (
                    <Sparkles className="w-3 h-3" />
                  )}
                  Study AI
                  {m.streaming ? " · live" : ""}
                </p>
                {m.streaming ? (
                  <StreamActivity
                    events={statusEvents}
                    live
                    keepAliveKey={m.content.length}
                    className="mt-1.5"
                  />
                ) : null}
              </div>
              {m.content ? (
                <StudyAIContent
                  content={m.content}
                  streaming={m.streaming}
                  citations={
                    m.citations ?? (m.streaming ? liveCitations : undefined)
                  }
                />
              ) : null}
              {!m.streaming && m.content && (
                <div className="mt-2.5 flex flex-wrap items-center gap-1 study-ai-followups">
                  {hasFlashcardDeck(m.content) && (
                    <button
                      type="button"
                      onClick={() => onStudyFlashcards(m.content)}
                      className="inline-flex items-center gap-1.5 h-[29px] px-2 rounded-[7px] text-[10px] text-[var(--accent)] hover:bg-[var(--accent-subtle)] transition-colors"
                    >
                      <Layers className="w-3 h-3" />
                      Study cards
                    </button>
                  )}
                  <CopyMessageButton text={m.content} variant="action" />
                  <button
                    type="button"
                    onClick={() => onSave(m.content)}
                    className="inline-flex items-center gap-1.5 h-[29px] px-2 rounded-[7px] text-[10px] text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    <Bookmark className="w-3 h-3" />
                    Save
                  </button>
                  {!m.id.startsWith("tmp-") && (
                    <DeleteMessageButton
                      onDelete={() => onDelete(m.id)}
                      disabled={editingDisabled}
                    />
                  )}
                </div>
              )}
              <CitationList
                citations={
                  m.citations ?? (m.streaming ? liveCitations : undefined)
                }
                variant="sources-used"
              />
            </div>
          </div>
        )
      )}
    </>
  );
}
