"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { FileText, Folder, Lock } from "lucide-react";
import { BrowseFolderLink } from "@/components/learn/BrowseFolderLink";
import { ExploreAreaIcon } from "@/components/learn/explore/ExploreAreaIcon";
import { ExploreSidebarHomeTree } from "@/components/learn/explore/ExploreSidebarHomeTree";
import { useLearnNavigation } from "@/components/learn/LearnNavigationProvider";
import { useLearnSubjects } from "@/hooks/useLearnSubjects";
import { useAuth } from "@/hooks/useAuth";
import { PersonalPageReaderScope } from "@/components/my-content/reader/types";
import {
  EXPLORE_AREAS,
  ExploreAreaId,
  areaSidebarRows,
  catalogGoalAllowsArea,
  isExploreAreaId,
  learnAreaHref,
  subjectExploreHref,
} from "@/lib/exploreCatalog";
import { subjectHref, subjectMatchesCatalogGoal, topicHref } from "@/lib/learnCatalog";
import { learnHref, learnScope } from "@/lib/learnContent";
import { isPremiumUser } from "@/lib/premium";
import { ArticleSummary, StudyGoal, Topic } from "@/types";

function topicMatchesQuery(topic: Topic, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  if (topic.title.toLowerCase().includes(needle)) return true;
  return (topic.articles ?? []).some((article) =>
    article.title.toLowerCase().includes(needle)
  );
}

function articleMatchesQuery(article: ArticleSummary, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return article.title.toLowerCase().includes(needle);
}

export function ExploreSidebarBrowse({
  mode,
  activeArea,
  activeSubject,
  activeTopic,
  activeArticle,
  searchQuery = "",
  studyGoal = "GENERAL",
  workspaceMode = false,
  onOpenPage,
}: {
  mode: "home" | "area" | "collection";
  activeArea?: ExploreAreaId | null;
  activeSubject?: string | null;
  activeTopic?: string | null;
  activeArticle?: string | null;
  searchQuery?: string;
  studyGoal?: StudyGoal;
  workspaceMode?: boolean;
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
  const { subjects } = useLearnSubjects();
  const scopedRows = activeArea ? areaSidebarRows(subjects, activeArea) : [];
  const collectionSubject = activeSubject
    ? subjects.find((s) => s.slug === activeSubject)
    : undefined;
  const collectionTopic =
    collectionSubject && activeTopic
      ? collectionSubject.topics.find((t) => t.slug === activeTopic)
      : undefined;

  const openArticle = (topicSlug: string, article: ArticleSummary) => {
    if (!collectionSubject) return;
    const href = learnHref(collectionSubject.slug, topicSlug, article.slug);
    const scope = learnScope(collectionSubject.slug, topicSlug, article.slug);
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

  const collectionBody =
    mode === "collection" && activeSubject && collectionSubject ? (
      subjectMatchesCatalogGoal(collectionSubject, studyGoal) ? (
      <div>
        <p className="explore-side-label">Public collection</p>
        <BrowseFolderLink
          path={{
            areaId: activeArea,
            subjectSlug: collectionSubject.slug,
          }}
          href={subjectHref(collectionSubject.slug)}
          className={clsx(
            "explore-side-collection",
            !activeTopic && "explore-side-collection-active"
          )}
        >
          <span className="explore-side-collection-mark" aria-hidden>
            {collectionSubject.icon ||
              collectionSubject.name.charAt(0).toUpperCase()}
          </span>
          <span className="truncate">{collectionSubject.name}</span>
        </BrowseFolderLink>

        <div className="mt-3 pt-2 border-t border-[var(--border-subtle)]">
          <p className="explore-side-label">Topics</p>
          {collectionSubject.topics
            .filter((topic) => topicMatchesQuery(topic, searchQuery))
            .map((topic) => {
              const count = topic.articles?.length ?? 0;
              const isActive =
                activeTopic === topic.slug && !activeArticle;
              return (
                <BrowseFolderLink
                  key={topic.id}
                  path={{
                    areaId: activeArea,
                    subjectSlug: collectionSubject.slug,
                    topicSlug: topic.slug,
                  }}
                  href={topicHref(collectionSubject.slug, topic.slug)}
                  className={clsx(
                    "explore-side-row",
                    isActive && "explore-side-row-active"
                  )}
                >
                  <span className="explore-side-folder" aria-hidden>
                    <Folder className="w-3 h-3" />
                  </span>
                  <span className="min-w-0 flex-1 truncate">{topic.title}</span>
                  {count > 0 ? (
                    <span className="explore-side-count">{count}</span>
                  ) : null}
                </BrowseFolderLink>
              );
            })}
        </div>

        {collectionTopic ? (
          <div className="mt-3 pt-2 border-t border-[var(--border-subtle)]">
            <p className="explore-side-label">Articles</p>
            {(collectionTopic.articles ?? [])
              .filter((article) => articleMatchesQuery(article, searchQuery))
              .map((article) => {
                const isActive = activeArticle === article.slug;
                const rowClass = clsx(
                  "explore-side-row w-full border-0 bg-transparent cursor-pointer",
                  isActive && "explore-side-row-active"
                );
                const content = (
                  <>
                    <FileText className="w-3.5 h-3.5 shrink-0 text-[var(--text-muted)]" />
                    <span className="min-w-0 flex-1 truncate text-left">
                      {article.title}
                    </span>
                    {article.isPremium && !isPremium ? (
                      <Lock className="w-3 h-3 shrink-0 text-amber-500" />
                    ) : null}
                  </>
                );
                return workspaceMode ? (
                  <button
                    key={article.id}
                    type="button"
                    onClick={() => openArticle(collectionTopic.slug, article)}
                    className={rowClass}
                  >
                    {content}
                  </button>
                ) : (
                  <Link
                    key={article.id}
                    href={learnHref(
                      collectionSubject.slug,
                      collectionTopic.slug,
                      article.slug
                    )}
                    className={rowClass}
                    onClick={() =>
                      startReaderOpen(
                        learnHref(
                          collectionSubject.slug,
                          collectionTopic.slug,
                          article.slug
                        )
                      )
                    }
                  >
                    {content}
                  </Link>
                );
              })}
          </div>
        ) : null}
      </div>
      ) : (
        <p className="px-1.5 text-xs text-[var(--text-muted)]">
          This collection is outside your study track.
        </p>
      )
    ) : null;

  return (
    <div className="px-1.5 pb-2">
      <p className="px-1.5 pb-2 text-sm font-semibold text-[var(--text-primary)]">
        Explore
      </p>
      <div className="h-px bg-[var(--border-subtle)] -mx-1.5 mb-2" />

      {mode === "collection" && activeSubject ? (
        collectionBody ?? (
          <p className="px-1.5 text-xs text-[var(--text-muted)]">
            {subjects.length === 0 ? "Loading collection…" : "Collection not found."}
          </p>
        )
      ) : mode === "home" ? (
        <ExploreSidebarHomeTree
          activeArea={activeArea}
          activeSubject={activeSubject}
          activeTopic={activeTopic}
          searchQuery={searchQuery}
          studyGoal={studyGoal}
        />
      ) : activeArea ? (
        catalogGoalAllowsArea(activeArea, studyGoal) ? (
        <div>
          <p className="explore-side-label">
            {EXPLORE_AREAS.find((a) => a.id === activeArea)?.title}
          </p>
          <Link
            href={learnAreaHref(activeArea)}
            className={`explore-side-row${
              !activeSubject ? " explore-side-row-active" : ""
            }`}
          >
            <ExploreAreaIcon
              tone={
                EXPLORE_AREAS.find((a) => a.id === activeArea)?.tone ?? "exam"
              }
              size="sm"
            />
            <span className="min-w-0 flex-1 truncate">Overview</span>
          </Link>
          {scopedRows.map((row) => (
            <Link
              key={row.slug}
              href={subjectExploreHref(row.slug)}
              className={`explore-side-row${
                activeSubject === row.slug ? " explore-side-row-active" : ""
              }`}
            >
              <span className="explore-side-folder" aria-hidden>
                <Folder className="w-3 h-3" />
              </span>
              <span className="min-w-0 flex-1 truncate">{row.title}</span>
              {row.count > 0 ? (
                <span className="explore-side-count">{row.count}</span>
              ) : null}
            </Link>
          ))}
        </div>
        ) : (
          <p className="px-1.5 text-xs text-[var(--text-muted)]">
            This browse area is outside your study track.
          </p>
        )
      ) : null}
    </div>
  );
}

export function parseExploreAreaFromSearch(
  value: string | null
): ExploreAreaId | null {
  return isExploreAreaId(value) ? value : null;
}
