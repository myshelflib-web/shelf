"use client";

import Link from "next/link";
import { ChevronDown, ChevronRight, FileText, Folder, Lock, Newspaper } from "lucide-react";
import clsx from "clsx";
import { BrowseFolderLink } from "@/components/learn/BrowseFolderLink";
import { ExploreAreaIcon } from "@/components/learn/explore/ExploreAreaIcon";
import { useLearnSubjects } from "@/hooks/useLearnSubjects";
import {
  ExploreAreaDef,
  ExploreAreaId,
  countAreaItems,
  featuredExploreCollectionsForGoal,
  subjectsForArea,
  visibleExploreAreasForGoal,
} from "@/lib/exploreCatalog";
import { topicHref } from "@/lib/learnCatalog";
import { learnHref, learnScope } from "@/lib/learnContent";
import { withResolvedArea } from "@/lib/preloadedBrowse";
import { isPremiumUser } from "@/lib/premium";
import { useAuth } from "@/hooks/useAuth";
import { PersonalPageReaderScope } from "@/components/my-content/reader/types";
import { ArticleSummary, StudyGoal, Subject, Topic } from "@/types";

type OpenPageFn = (payload: {
  href: string;
  title: string;
  pageId: string;
  scope: PersonalPageReaderScope;
}) => void;

function topicMatchesQuery(topic: Topic, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  if (topic.title.toLowerCase().includes(needle)) return true;
  return (topic.articles ?? []).some((article) =>
    article.title.toLowerCase().includes(needle)
  );
}

function subjectMatchesQuery(subject: Subject, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  if (subject.name.toLowerCase().includes(needle)) return true;
  return subject.topics.some((topic) => topicMatchesQuery(topic, query));
}

function articleMatchesQuery(article: ArticleSummary, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return article.title.toLowerCase().includes(needle);
}

export function ExploreSidebarHomeTree({
  activeArea,
  activeSubject,
  activeTopic,
  activeArticle,
  searchQuery = "",
  studyGoal = "GENERAL",
  onOpenPage,
}: {
  activeArea?: ExploreAreaId | null;
  activeSubject?: string | null;
  activeTopic?: string | null;
  activeArticle?: string | null;
  searchQuery?: string;
  studyGoal?: StudyGoal;
  onOpenPage?: OpenPageFn;
}) {
  const { subjects } = useLearnSubjects();
  const featured = featuredExploreCollectionsForGoal(subjects, studyGoal);
  const browseAreas = visibleExploreAreasForGoal(subjects, studyGoal);
  const resolved = withResolvedArea(
    {
      areaId: activeArea,
      subjectSlug: activeSubject ?? undefined,
      topicSlug: activeTopic ?? undefined,
    },
    subjects
  );
  const expandArea = resolved.areaId ?? null;

  return (
    <>
      <div className="mt-1">
        <p className="explore-side-label">Browse</p>
        <Link href="/learn/current-affairs" className="explore-side-row">
          <span className="explore-side-chevron" aria-hidden />
          <Newspaper className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
          <span className="min-w-0 flex-1 truncate">Live current affairs</span>
        </Link>
        {browseAreas.map((area) => (
          <AreaBranch
            key={area.id}
            area={area}
            subjects={subjects}
            expanded={
              expandArea === area.id ||
              (Boolean(searchQuery.trim()) &&
                subjectsForArea(subjects, area.id).some((s) =>
                  subjectMatchesQuery(s, searchQuery)
                ))
            }
            activeSubject={activeSubject}
            activeTopic={activeTopic}
            activeArticle={activeArticle}
            searchQuery={searchQuery}
            lockFolders={Boolean(onOpenPage)}
            onOpenPage={onOpenPage}
          />
        ))}
      </div>

      {featured.length > 0 ? (
        <div className="mt-3 pt-2 border-t border-[var(--border-subtle)]">
          <p className="explore-side-label">Public collections</p>
          {featured.map((subject) => (
            <BrowseFolderLink
              key={subject.id}
              path={withResolvedArea({ subjectSlug: subject.slug }, subjects)}
              preventNav={Boolean(onOpenPage)}
              className={clsx(
                "explore-side-collection",
                activeSubject === subject.slug && "explore-side-collection-active"
              )}
            >
              <span className="explore-side-collection-mark" aria-hidden>
                {subject.icon || subject.name.charAt(0).toUpperCase()}
              </span>
              <span className="truncate">{subject.name}</span>
            </BrowseFolderLink>
          ))}
        </div>
      ) : null}
    </>
  );
}

function AreaBranch({
  area,
  subjects,
  expanded,
  activeSubject,
  activeTopic,
  activeArticle,
  searchQuery,
  lockFolders,
  onOpenPage,
}: {
  area: ExploreAreaDef;
  subjects: Subject[];
  expanded: boolean;
  activeSubject?: string | null;
  activeTopic?: string | null;
  activeArticle?: string | null;
  searchQuery: string;
  lockFolders?: boolean;
  onOpenPage?: OpenPageFn;
}) {
  const count = countAreaItems(subjects, area.id);
  const collections = subjectsForArea(subjects, area.id).filter((s) =>
    subjectMatchesQuery(s, searchQuery)
  );
  const areaActive = expanded && !activeSubject;

  return (
    <div>
      <BrowseFolderLink
        path={{ areaId: area.id }}
        preventNav={lockFolders}
        className={clsx(
          "explore-side-row",
          areaActive && "explore-side-row-active"
        )}
      >
        <span className="explore-side-chevron" aria-hidden>
          {expanded ? (
            <ChevronDown className="w-3 h-3" />
          ) : (
            <ChevronRight className="w-3 h-3" />
          )}
        </span>
        <ExploreAreaIcon tone={area.tone} size="sm" />
        <span className="min-w-0 flex-1 truncate">{area.title}</span>
        <span className="explore-side-count">{count}</span>
      </BrowseFolderLink>
      {expanded ? (
        <div className="explore-side-branch">
          {collections.map((subject) => (
            <CollectionBranch
              key={subject.id}
              subject={subject}
              areaId={area.id}
              expanded={activeSubject === subject.slug}
              activeTopic={activeTopic}
              activeArticle={activeArticle}
              searchQuery={searchQuery}
              lockFolders={lockFolders}
              onOpenPage={onOpenPage}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function CollectionBranch({
  subject,
  areaId,
  expanded,
  activeTopic,
  activeArticle,
  searchQuery,
  lockFolders,
  onOpenPage,
}: {
  subject: Subject;
  areaId: ExploreAreaId;
  expanded: boolean;
  activeTopic?: string | null;
  activeArticle?: string | null;
  searchQuery: string;
  lockFolders?: boolean;
  onOpenPage?: OpenPageFn;
}) {
  const topics = subject.topics.filter((topic) =>
    topicMatchesQuery(topic, searchQuery)
  );
  const collectionActive = expanded && !activeTopic;

  return (
    <div>
      <BrowseFolderLink
        path={{ areaId, subjectSlug: subject.slug }}
        preventNav={lockFolders}
        className={clsx(
          "explore-side-row",
          collectionActive && "explore-side-row-active"
        )}
      >
        <span className="explore-side-chevron" aria-hidden>
          {expanded ? (
            <ChevronDown className="w-3 h-3" />
          ) : (
            <ChevronRight className="w-3 h-3" />
          )}
        </span>
        <span className="explore-side-folder" aria-hidden>
          <Folder className="w-3 h-3" />
        </span>
        <span className="min-w-0 flex-1 truncate">{subject.name}</span>
      </BrowseFolderLink>
      {expanded ? (
        <div className="explore-side-branch">
          {topics.map((topic) => (
            <TopicBranch
              key={topic.id}
              topic={topic}
              areaId={areaId}
              subjectSlug={subject.slug}
              expanded={activeTopic === topic.slug}
              activeArticle={activeArticle}
              searchQuery={searchQuery}
              lockFolders={lockFolders}
              onOpenPage={onOpenPage}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function TopicBranch({
  topic,
  areaId,
  subjectSlug,
  expanded,
  activeArticle,
  searchQuery,
  lockFolders,
  onOpenPage,
}: {
  topic: Topic;
  areaId: ExploreAreaId;
  subjectSlug: string;
  expanded: boolean;
  activeArticle?: string | null;
  searchQuery: string;
  lockFolders?: boolean;
  onOpenPage?: OpenPageFn;
}) {
  const { user } = useAuth();
  const isPremium = isPremiumUser(user);
  const articles = (topic.articles ?? []).filter((article) =>
    articleMatchesQuery(article, searchQuery)
  );
  const count = topic.articles?.length ?? 0;
  const topicActive = expanded && !activeArticle;

  return (
    <div>
      <BrowseFolderLink
        path={{ areaId, subjectSlug, topicSlug: topic.slug }}
        href={topicHref(subjectSlug, topic.slug)}
        preventNav={lockFolders}
        className={clsx(
          "explore-side-row",
          topicActive && "explore-side-row-active"
        )}
      >
        <span className="explore-side-chevron" aria-hidden>
          {expanded ? (
            <ChevronDown className="w-3 h-3" />
          ) : (
            <ChevronRight className="w-3 h-3" />
          )}
        </span>
        <span className="explore-side-folder" aria-hidden>
          <Folder className="w-3 h-3" />
        </span>
        <span className="min-w-0 flex-1 truncate">{topic.title}</span>
        {count > 0 ? <span className="explore-side-count">{count}</span> : null}
      </BrowseFolderLink>
      {expanded ? (
        <div className="explore-side-branch">
          {articles.map((article) => {
            const isActive = activeArticle === article.slug;
            return (
              <BrowseFolderLink
                key={article.id}
                path={{
                  areaId,
                  subjectSlug,
                  topicSlug: topic.slug,
                  articleSlug: article.slug,
                }}
                href={learnHref(subjectSlug, topic.slug, article.slug)}
                onOpen={
                  onOpenPage
                    ? () =>
                        onOpenPage({
                          href: learnHref(
                            subjectSlug,
                            topic.slug,
                            article.slug
                          ),
                          title: article.title,
                          pageId: article.id,
                          scope: learnScope(
                            subjectSlug,
                            topic.slug,
                            article.slug
                          ),
                        })
                    : undefined
                }
                className={clsx(
                  "explore-side-row",
                  isActive && "explore-side-row-active"
                )}
              >
                <span className="explore-side-chevron" aria-hidden />
                <FileText className="w-3.5 h-3.5 shrink-0 text-[var(--text-muted)]" />
                <span className="min-w-0 flex-1 truncate">{article.title}</span>
                {article.isPremium && !isPremium ? (
                  <Lock className="w-3 h-3 shrink-0 text-amber-500" />
                ) : null}
              </BrowseFolderLink>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
