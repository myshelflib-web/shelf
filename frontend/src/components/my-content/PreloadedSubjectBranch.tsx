"use client";

import Link from "next/link";
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
  workspaceMode,
  navigateOnSubjectClick = false,
  navigateOnTopicClick = false,
  subjectHref: subjectHrefProp,
  getTopicHref,
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
  workspaceMode: boolean;
  navigateOnSubjectClick?: boolean;
  navigateOnTopicClick?: boolean;
  subjectHref?: string;
  getTopicHref?: (topicSlug: string) => string;
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

  const subjectRowClass = clsx(
    "library-row group flex items-center gap-0.5 px-1.5 py-1 rounded-md",
    isCurrent
      ? "bg-[var(--accent-light)] text-[var(--accent)]"
      : "hover:bg-[var(--bg-elevated)]"
  );

  return (
    <div className="mb-0.5">
      <div className={subjectRowClass}>
        <button
          type="button"
          aria-label={open ? "Collapse collection" : "Expand collection"}
          onClick={(e) => {
            e.stopPropagation();
            onToggleSubject(subject.slug);
          }}
          className="p-0.5 text-[var(--text-muted)] shrink-0 rounded hover:bg-[var(--bg-secondary)]"
        >
          {open ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5" />
          )}
        </button>
        {navigateOnSubjectClick && subjectHrefProp ? (
          <Link
            href={subjectHrefProp}
            className="flex flex-1 min-w-0 items-center gap-1.5 py-0.5"
          >
            <FolderMark seed={subject.id} size={14} />
            <span className="flex-1 min-w-0 truncate text-[13px] font-medium text-[var(--text-primary)] text-left">
              {subject.name}
            </span>
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => onToggleSubject(subject.slug)}
            className="flex flex-1 min-w-0 items-center gap-1.5 py-0.5 text-left"
          >
            <FolderMark seed={subject.id} size={14} />
            <span className="flex-1 min-w-0 truncate text-[13px] font-medium text-[var(--text-primary)]">
              {subject.name}
            </span>
          </button>
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
            const topicHrefValue = getTopicHref?.(topic.slug);

            return (
              <div key={topic.id}>
                <div className={clsx(subjectRowClass, isTopicActive && "bg-[var(--accent-light)] text-[var(--accent)]")}>
                  <button
                    type="button"
                    aria-label={tOpen ? "Collapse topic" : "Expand topic"}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleTopic(subject.slug, topic.slug);
                    }}
                    className="p-0.5 text-[var(--text-muted)] shrink-0 rounded hover:bg-[var(--bg-secondary)]"
                  >
                    {tOpen ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                  </button>
                  {navigateOnTopicClick && topicHrefValue ? (
                    <Link
                      href={topicHrefValue}
                      className="flex flex-1 min-w-0 items-center gap-1.5 py-0.5"
                    >
                      <BookOpen
                        className="w-3.5 h-3.5 shrink-0"
                        style={{ color: tone.fg }}
                      />
                      <span className="flex-1 min-w-0 truncate text-[13px] text-[var(--text-secondary)] text-left">
                        {topic.title}
                      </span>
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onToggleTopic(subject.slug, topic.slug)}
                      className="flex flex-1 min-w-0 items-center gap-1.5 py-0.5 text-left"
                    >
                      <BookOpen
                        className="w-3.5 h-3.5 shrink-0"
                        style={{ color: tone.fg }}
                      />
                      <span className="flex-1 min-w-0 truncate text-[13px] text-[var(--text-secondary)]">
                        {topic.title}
                      </span>
                    </button>
                  )}
                </div>

                {tOpen && articles.length > 0 && (
                  <div className="ml-3 pl-2 border-l border-[var(--border)] space-y-0.5 mt-0.5">
                    {articles.map((article) => {
                      const isActive =
                        activeSubject === subject.slug &&
                        activeTopic === topic.slug &&
                        activeArticle === article.slug;
                      return (
                        <button
                          key={article.id}
                          type="button"
                          onClick={() => openArticle(topic.slug, article)}
                          className={clsx(
                            "library-row group flex w-full items-center gap-1 rounded-md text-[13px] min-w-0 px-1.5 py-1 text-left",
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
                        </button>
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
