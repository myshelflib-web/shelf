"use client";

import { Bookmark, Sparkles } from "lucide-react";
import { StudyAIContent } from "@/lib/studyAiMarkdown";
import { CopyMessageButton } from "@/components/study-ai/CopyMessageButton";
import { DeleteMessageButton } from "@/components/study-ai/DeleteMessageButton";
import { CitationList } from "@/components/study-ai/CitationList";
import {
  StreamActivity,
  type StreamStatusEvent,
} from "@/components/study-ai/StreamActivity";
import { ShelfLogo } from "@/components/ShelfLogo";
import type { WorkspaceMessage } from "@/lib/studyAiWorkspaceUtils";
import { LibraryCitation } from "@/types";

export function StudyAiMessageList({
  messages,
  statusEvents,
  liveCitations,
  onSave,
  onDelete,
}: {
  messages: WorkspaceMessage[];
  statusEvents: StreamStatusEvent[];
  liveCitations?: LibraryCitation[];
  onSave: (content: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <>
      {messages.map((m) =>
        m.role === "user" ? (
          <div key={m.id} className="study-ai-msg group flex justify-end">
            <div className="max-w-[72%]">
              <div className="rounded-2xl rounded-br-md bg-[var(--accent)] text-white px-4 py-3 text-[13px] whitespace-pre-wrap leading-relaxed">
                {m.content}
              </div>
              {!m.id.startsWith("tmp-") && (
                <div className="mt-1 flex justify-end opacity-0 group-hover:opacity-100 focus-within:opacity-100">
                  <DeleteMessageButton onDelete={() => onDelete(m.id)} />
                </div>
              )}
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
                <StudyAIContent content={m.content} streaming={m.streaming} />
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
                    onClick={() => onSave(m.content)}
                    className="inline-flex items-center gap-1.5 h-[29px] px-2 rounded-[7px] text-[10px] text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    <Bookmark className="w-3 h-3" />
                    Save
                  </button>
                  {!m.id.startsWith("tmp-") && (
                    <DeleteMessageButton onDelete={() => onDelete(m.id)} />
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
