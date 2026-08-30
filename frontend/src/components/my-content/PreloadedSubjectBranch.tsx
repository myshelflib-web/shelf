"use client";

import { useRouter } from "next/navigation";
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  FileText,
  Lock,
} from "lucide-react";
import clsx from "clsx";
import { FolderMark } from "@/components/FolderMark";
import { folderTone } from "@/lib/folderTone";
import { learnHref, learnScope } from "@/lib/learnContent";
import { isPremiumUser } from "@/lib/premium";
import { ArticleSummary, Subject } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { PersonalPageReaderScope } from "@/components/my-content/reader/types";

export function PreloadedSubjectBranch({
  subject,
  open,
  expandedTopics,
  activeSubject,
  activeTopic,
  activeArticle,
  completed,
  total,
  workspaceMode,
  onToggleSubject,
  onToggleTopic,
  onOpenPage,
}: {
  subject: Subject;
  open: boolean;
  expandedTopics: Record<string, boolean>;
  activeSubject?: string;
  activeTopic?: string;
  activeArticle?: string;
  completed?: number;
  total?: number;
  workspaceMode: boolean;
  onToggleSubject: (slug: string) => void;
  onToggleTopic: (subjectSlug: string, topicSlug: string) => void;
  onOpenPage?: (payload: {
    href: string;
    title: string;
    pageId: string;
    scope: PersonalPageReaderScope;
  }) => void;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const isPremium = isPremiumUser(user);
  const isCurrent = activeSubject === subject.slug && !activeTopic;

  const openArticle = (topicSlug: string, article: ArticleSummary) => {
    const href = learnHref(subject.slug, topicSlug, article.slug);
    const scope = learnScope(subject.slug, topicSlug, article.slug);
    if (workspaceMode && onOpenPage) {
      onOpenPage({
        href,
        title: article.title,
        pageId: article.id,
        scope,
      });
      return;
    }
    router.push(href);
  };

  return (
    <div className="mb-1 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)]/70 overflow-hidden">
      <div
        role="button"
        tabIndex={0}
        onClick={() => onToggleSubject(subject.slug)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggleSubject(subject.slug);
          }
        }}
        className={clsx(
          "library-row group flex items-center gap-0.5 px-1.5 py-1 rounded-md cursor-pointer",
          isCurrent
            ? "bg-[var(--accent-light)] text-[var(--accent)]"
            : "hover:bg-[var(--bg-elevated)]"
        )}
      >
        <span className="p-0.5 text-[var(--text-muted)] shrink-0">
          {open ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </span>
        <FolderMark seed={subject.id} size={14} />
        <span className="flex-1 min-w-0 truncate text-[13px] font-medium text-[var(--text-primary)] text-left">
          {subject.name}
        </span>
        {typeof completed === "number" && typeof total === "number" && (
          <span className="text-[10px] text-[var(--text-muted)] shrink-0 tabular-nums">
            {completed}/{total}
          </span>
        )}
      </div>

      {open && (
        <div className="ml-3 pl-2 border-l border-[var(--border)] space-y-0.5 mt-0.5">
          {subject.topics.map((topic) => {
            const tKey = `${subject.slug}:${topic.slug}`;
            const tOpen = expandedTopics[tKey] ?? false;
            const articles = topic.articles ?? [];
            const isTopicActive =
              activeSubject === subject.slug &&
              activeTopic === topic.slug &&
              !activeArticle;
            const tone = folderTone(topic.id);

            return (
              <div key={topic.id}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => onToggleTopic(subject.slug, topic.slug)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onToggleTopic(subject.slug, topic.slug);
                    }
                  }}
                  className={clsx(
                    "library-row group flex items-center gap-0.5 px-1.5 py-1 rounded-md cursor-pointer",
                    isTopicActive
                      ? "bg-[var(--accent-light)] text-[var(--accent)]"
                      : "hover:bg-[var(--bg-elevated)]"
                  )}
                >
                  <span className="p-0.5 text-[var(--text-muted)] shrink-0">
                    {tOpen ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                  </span>
                  <BookOpen
                    className="w-3.5 h-3.5 shrink-0"
                    style={{ color: tone.fg }}
                  />
                  <span className="flex-1 min-w-0 truncate text-[13px] text-[var(--text-secondary)] text-left">
                    {topic.title}
                  </span>
                  <span className="text-[10px] text-[var(--text-muted)] shrink-0">
                    {articles.length}
                  </span>
                </div>

                {tOpen && articles.length > 0 && (
                  <div className="ml-3 pl-2 border-l border-[var(--border)] space-y-0.5 mt-0.5">
                    {articles.map((article) => {
                      const isActive =
                        activeSubject === subject.slug &&
                        activeTopic === topic.slug &&
                        activeArticle === article.slug;
                      return (
                        <div
                          key={article.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => openArticle(topic.slug, article)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              openArticle(topic.slug, article);
                            }
                          }}
                          className={clsx(
                            "library-row group flex items-center gap-1 rounded-md text-[13px] min-w-0 px-1.5 py-1 cursor-pointer",
                            isActive
                              ? "bg-[var(--accent-light)] text-[var(--accent)]"
                              : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                          )}
                        >
                          <FileText className="w-3.5 h-3.5 shrink-0 opacity-60" />
                          <span className="flex-1 truncate">{article.title}</span>
                          {article.isPremium && !isPremium && (
                            <Lock className="w-3 h-3 shrink-0 text-amber-500" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
