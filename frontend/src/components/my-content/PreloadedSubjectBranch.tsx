"use client";

import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Lock,
} from "lucide-react";
import clsx from "clsx";
import { FolderMark } from "@/components/FolderMark";
import { useLearnNavigation } from "@/components/learn/LearnNavigationProvider";
import { learnHref, learnScope } from "@/lib/learnContent";
import { isPremiumUser } from "@/lib/premium";
import { ArticleSummary, Subject, Topic } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { PersonalPageReaderScope } from "@/components/my-content/reader/types";

function toggleOnKey(
  e: React.KeyboardEvent,
  action: () => void
) {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    action();
  }
}

const folderRowClass =
  "group flex items-center gap-0.5 px-1 py-1 rounded-md cursor-pointer hover:bg-[var(--bg-elevated)]";

export function PreloadedSubjectBranch({
  subject,
  open,
  expandedTopics,
  activeSubject,
  activeTopic,
  activeArticle,
  workspaceMode,
  topicsOnly = false,
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
  topicsOnly?: boolean;
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
  const { startReaderOpen } = useLearnNavigation();
  const { user } = useAuth();
  const isPremium = isPremiumUser(user);

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
    startReaderOpen(href);
    router.push(href);
  };

  const handleSubjectClick = () => {
    onToggleSubject(subject.slug);
    if (navigateOnSubjectClick && subjectHrefProp) {
      router.push(subjectHrefProp);
    }
  };

  const renderTopic = (topic: Topic) => {
    const tKey = `${subject.slug}:${topic.slug}`;
    const tOpen = expandedTopics[tKey] ?? false;
    const articles = topic.articles ?? [];
    const topicHrefValue = getTopicHref?.(topic.slug);

    const handleTopicClick = () => {
      onToggleTopic(subject.slug, topic.slug);
      if (navigateOnTopicClick && topicHrefValue) {
        router.push(topicHrefValue);
      }
    };

    return (
      <div key={topic.id}>
        <div
          role="button"
          tabIndex={0}
          onClick={handleTopicClick}
          onKeyDown={(e) => toggleOnKey(e, handleTopicClick)}
          className={folderRowClass}
        >
          <span className="p-0.5 text-[var(--text-muted)] shrink-0" aria-hidden>
            {tOpen ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </span>
          <FolderMark seed={topic.id} size={14} />
          <span className="flex-1 min-w-0 truncate text-[13px] font-medium text-[var(--text-primary)] text-left">
            {topic.title}
          </span>
        </div>

        {tOpen && articles.length > 0 && (
          <div className="ml-3 space-y-0.5 mt-0.5">
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
                  onKeyDown={(e) =>
                    toggleOnKey(e, () => openArticle(topic.slug, article))
                  }
                  className={clsx(
                    "library-row group flex items-center gap-0.5 rounded-md text-[13px] min-w-0 px-1 py-1 cursor-pointer outline-none",
                    isActive
                      ? "bg-[var(--bg-elevated)] text-[var(--text-primary)]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
                  )}
                >
                  <FileText className="w-3.5 h-3.5 shrink-0 text-[var(--text-muted)]" />
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
  };

  const topics = (
    <div className="space-y-0.5">{subject.topics.map(renderTopic)}</div>
  );

  if (topicsOnly) {
    return topics;
  }

  return (
    <div className="mb-0.5">
      <div
        role="button"
        tabIndex={0}
        onClick={handleSubjectClick}
        onKeyDown={(e) => toggleOnKey(e, handleSubjectClick)}
        className={clsx(folderRowClass, "px-1.5")}
      >
        <span className="p-0.5 text-[var(--text-muted)] shrink-0" aria-hidden>
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
      </div>

      {open && (
        <div className="ml-3 pl-2 border-l border-[var(--border)] space-y-0.5 mt-0.5">
          {topics}
        </div>
      )}
    </div>
  );
}
