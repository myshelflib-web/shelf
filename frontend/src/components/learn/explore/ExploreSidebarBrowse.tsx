"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { FileText, Folder, Lock, Newspaper } from "lucide-react";
import { ExploreAreaIcon } from "@/components/learn/explore/ExploreAreaIcon";
import { useLearnNavigation } from "@/components/learn/LearnNavigationProvider";
import { useLearnSubjects } from "@/hooks/useLearnSubjects";
import { useAuth } from "@/hooks/useAuth";
import { PersonalPageReaderScope } from "@/components/my-content/reader/types";
import {
  EXPLORE_AREAS,
  ExploreAreaId,
  areaSidebarRows,
  countAreaItems,
  featuredExploreCollections,
  isExploreAreaId,
  learnAreaHref,
  subjectExploreHref,
  visibleExploreAreas,
} from "@/lib/exploreCatalog";
import { subjectHref, topicHref } from "@/lib/learnCatalog";
import { learnHref, learnScope } from "@/lib/learnContent";
import { isPremiumUser } from "@/lib/premium";
import { ArticleSummary, Topic } from "@/types";

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
  workspaceMode = false,
  onOpenPage,
}: {
  mode: "home" | "area" | "collection";
  activeArea?: ExploreAreaId | null;
  activeSubject?: string | null;
  activeTopic?: string | null;
  activeArticle?: string | null;
  searchQuery?: string;
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
  const featured = featuredExploreCollections(subjects);
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
      <div>
        <p className="explore-side-label">Public collection</p>
        <Link
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
        </Link>

        <div className="mt-3 pt-2 border-t border-[var(--border-subtle)]">
          <p className="explore-side-label">Topics</p>
          {collectionSubject.topics
            .filter((topic) => topicMatchesQuery(topic, searchQuery))
            .map((topic) => {
              const count = topic.articles?.length ?? 0;
              const isActive =
                activeTopic === topic.slug && !activeArticle;
              return (
                <Link
                  key={topic.id}
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
                </Link>
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
        <>
          <div className="mt-1">
            <p className="explore-side-label">Browse</p>
            <Link href="/learn/current-affairs" className="explore-side-row">
              <Newspaper className="w-4 h-4 text-[var(--accent)] shrink-0" />
              <span className="min-w-0 flex-1 truncate">Live current affairs</span>
            </Link>
            {visibleExploreAreas(subjects).map((area) => {
              const count = countAreaItems(subjects, area.id);
              return (
                <Link
                  key={area.id}
                  href={learnAreaHref(area.id)}
                  className="explore-side-row"
                >
                  <ExploreAreaIcon tone={area.tone} size="sm" />
                  <span className="min-w-0 flex-1 truncate">{area.title}</span>
                  <span className="explore-side-count">{count}</span>
                </Link>
              );
            })}
          </div>

          {featured.length > 0 ? (
            <div className="mt-3 pt-2 border-t border-[var(--border-subtle)]">
              <p className="explore-side-label">Public collections</p>
              {featured.map((subject) => (
                <Link
                  key={subject.id}
                  href={subjectExploreHref(subject.slug)}
                  className={`explore-side-collection${
                    activeSubject === subject.slug
                      ? " explore-side-collection-active"
                      : ""
                  }`}
                >
                  <span className="explore-side-collection-mark" aria-hidden>
                    {subject.icon || subject.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="truncate">{subject.name}</span>
                </Link>
              ))}
            </div>
          ) : null}
        </>
      ) : activeArea ? (
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
            <span className="min-w-0 flex-1 truncate">All in area</span>
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
      ) : null}
    </div>
  );
}

export function parseExploreAreaFromSearch(
  value: string | null
): ExploreAreaId | null {
  return isExploreAreaId(value) ? value : null;
}
