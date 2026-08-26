"use client";

import Link from "next/link";
import { MoreHorizontal, Paperclip, Plus, Search } from "lucide-react";
import {
  filterThreads,
  groupThreadsByDate,
} from "@/lib/studyAiThreadGroups";
import { threadSidebarMeta } from "@/lib/studyAiWorkspaceUtils";
import { ChatThreadSummary } from "@/types";

export function StudyAiSidebar({
  threads,
  threadsLoading,
  searchQuery,
  onSearchQuery,
  activeId,
  onNewChat,
  onOpenMenu,
}: {
  threads: ChatThreadSummary[];
  threadsLoading: boolean;
  searchQuery: string;
  onSearchQuery: (q: string) => void;
  activeId?: string;
  onNewChat: () => void;
  onOpenMenu: (el: HTMLElement, threadId: string) => void;
}) {
  const filteredGroups = groupThreadsByDate(
    filterThreads(threads, searchQuery)
  );

  return (
    <aside className="study-ai-sidebar hidden sm:flex w-[260px] shrink-0 flex-col border-r border-[var(--border)] bg-[var(--bg-sidebar)]">
      <div className="p-3 shrink-0">
        <button
          type="button"
          onClick={onNewChat}
          className="w-full h-[42px] flex items-center justify-center gap-1.5 text-[12px] font-semibold rounded-[10px] bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--accent)] hover:bg-[var(--accent-subtle)] transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          New chat
        </button>

        <div className="mt-2.5 h-9 flex items-center gap-2 px-2.5 rounded-[9px] border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-muted)]">
          <Search className="w-3.5 h-3.5 shrink-0" />
          <input
            value={searchQuery}
            onChange={(e) => onSearchQuery(e.target.value)}
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
                      <Link href={`/study-ai/${t.id}`} className="flex-1 min-w-0">
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
                          onOpenMenu(e.currentTarget, t.id);
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
  );
}
