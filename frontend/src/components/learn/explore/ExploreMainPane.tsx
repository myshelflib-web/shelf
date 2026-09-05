"use client";

import { ExploreWorkspaceShell } from "@/components/learn/explore/ExploreWorkspaceShell";
import { ExploreAreaIcon } from "@/components/learn/explore/ExploreAreaIcon";
import { ExploreAreaContent } from "@/components/learn/explore/ExploreAreaContent";
import { ExploreCollectionContent } from "@/components/learn/explore/ExploreCollectionContent";
import { useLearnNavigation } from "@/components/learn/LearnNavigationProvider";
import {
  LearnCatalogSkeleton,
  LearnCollectionSkeleton,
} from "@/components/learn/LearnBrowseSkeletons";
import { useLearnSubjects } from "@/hooks/useLearnSubjects";
import { useAuth } from "@/hooks/useAuth";
import { isPremiumUser } from "@/lib/premium";
import {
  ExploreAreaId,
  areaForSubject,
  collectionMeta,
  countAreaItems,
  featuredExploreCollectionsForGoal,
  getExploreArea,
  learnAreaHref,
  listAreaResources,
  subjectExploreHref,
  subjectsForArea,
  featuredExploreCollections,
  visibleExploreAreas,
  visibleExploreAreasForGoal,
} from "@/lib/exploreCatalog";
import {
  searchLearnCatalog,
  subjectsForCatalogGoal,
} from "@/lib/learnCatalog";
import { BrowseFolderLink, useOpenBrowseHref } from "@/components/learn/BrowseFolderLink";
import { useOptionalPreloadedBrowse } from "@/components/learn/PreloadedBrowseContext";
import { isLearnReaderHref, learnHref } from "@/lib/learnContent";
import { withResolvedArea } from "@/lib/preloadedBrowse";
import { Subject, StudyGoal, Topic } from "@/types";
import { useEffect, useMemo, useState } from "react";
import { useLearnStudyGoal } from "@/hooks/useLearnStudyGoal";

function scopedSearchPlaceholder(opts: {
  areaId?: ExploreAreaId | null;
  subject?: Subject;
  topic?: Topic;
}): string {
  if (opts.topic) return `Search in ${opts.topic.title}…`;
  if (opts.subject) return `Search in ${opts.subject.name}…`;
  if (opts.areaId) return `Search within ${getExploreArea(opts.areaId).title}…`;
  return "Search study skills, polity, economy…";
}

function scopedSearchLabel(opts: {
  areaId?: ExploreAreaId | null;
  subject?: Subject;
}): string | undefined {
  if (opts.subject) return opts.subject.name;
  if (opts.areaId) return getExploreArea(opts.areaId).title;
  return "Public material";
}

export function ExploreMainPane({
  subjectSlug,
  topicSlug,
  areaId,
  sidebarAreaId,
  returnTo,
}: {
  subjectSlug?: string;
  topicSlug?: string;
  areaId?: ExploreAreaId | null;
  sidebarAreaId?: ExploreAreaId | null;
  returnTo: string;
}) {
  const { startReaderOpen } = useLearnNavigation();
  const openBrowseHref = useOpenBrowseHref();
  const browse = useOptionalPreloadedBrowse();
  const { user } = useAuth();
  const { goal: filterGoal, accountGoal } = useLearnStudyGoal();
  const catalogGoal: StudyGoal = user ? (accountGoal ?? "GENERAL") : filterGoal;
  const isPremium = isPremiumUser(user);
  const { subjects, loading } = useLearnSubjects();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const subject = subjectSlug
    ? subjects.find((s) => s.slug === subjectSlug)
    : undefined;
  const topic =
    subject && topicSlug
      ? subject.topics.find((t) => t.slug === topicSlug)
      : undefined;

  const isHome = !subjectSlug && !areaId;

  const resolvedAreaId =
    sidebarAreaId ??
    areaId ??
    (subject ? areaForSubject(subject) : null);

  const openHit = (href: string) => {
    if (isLearnReaderHref(href) && !browse?.interceptFolderNav) {
      startReaderOpen(href);
    }
    openBrowseHref(href);
  };

  const searchSubjects = useMemo(() => {
    if (subject) return [subject];
    if (areaId) {
      return subjectsForArea(subjects, areaId, catalogGoal);
    }
    return subjectsForCatalogGoal(subjects, catalogGoal);
  }, [subjects, subject, areaId, catalogGoal]);

  const hits = useMemo(() => {
    const q = query.trim();
    if (!q) return [];
    return searchLearnCatalog(searchSubjects, q);
  }, [query, searchSubjects]);

  useEffect(() => {
    setActive(0);
  }, [query, subjectSlug, topicSlug, areaId]);

  const resources = useMemo(() => {
    if (areaId && !subjectSlug) {
      return listAreaResources(subjects, areaId, { query, goal: catalogGoal });
    }
    if (subject) {
      const items = listAreaResources(subjects, areaForSubject(subject), {
        subjectSlug: subject.slug,
        topicSlug: topic?.slug,
        query,
        goal: catalogGoal,
      });
      if (items.length > 0) return items;
      const manual: ReturnType<typeof listAreaResources> = [];
      for (const t of subject.topics) {
        if (topic && t.slug !== topic.slug) continue;
        for (const article of t.articles ?? []) {
          const needle = query.trim().toLowerCase();
          if (
            needle &&
            !article.title.toLowerCase().includes(needle) &&
            !t.title.toLowerCase().includes(needle)
          ) {
            continue;
          }
          manual.push({
            id: article.id,
            title: article.title,
            href: learnHref(subject.slug, t.slug, article.slug),
            typeLabel: article.isPremium ? "Premium" : "Article",
            meta: `${subject.name} · ${t.title}`,
            copy: "Open this public resource inside Shelf, then save a copy to your own Library if it is useful.",
            subjectSlug: subject.slug,
            topicSlug: t.slug,
            updatedAt: article.updatedAt ?? null,
          });
        }
      }
      return manual;
    }
    return [];
  }, [subjects, areaId, subject, topic, query, subjectSlug, catalogGoal]);

  const featured = featuredExploreCollectionsForGoal(subjects, catalogGoal);
  const searching = loading && query.trim().length > 0 && hits.length === 0;

  return (
    <ExploreWorkspaceShell
        returnTo={returnTo}
        searchQuery={query}
        onSearchQueryChange={setQuery}
        searchPlaceholder={scopedSearchPlaceholder({ areaId, subject, topic })}
        searchScopeLabel={scopedSearchLabel({ areaId, subject })}
        searchHits={hits}
        searchSearching={searching}
        searchActive={active}
        onSearchActiveChange={setActive}
        onOpenSearchHit={openHit}
      >
      {isHome ? (
        <ExploreHomeContent
          subjects={subjects}
          loading={loading}
          featured={featured}
          catalogGoal={catalogGoal}
        />
      ) : areaId && !subjectSlug ? (
        <ExploreAreaContent
          areaId={areaId}
          subjects={subjects}
          resources={resources}
          loading={loading}
          query={query}
          catalogGoal={catalogGoal}
        />
      ) : subject ? (
        <ExploreCollectionContent
          subject={subject}
          topic={topic}
          resources={resources}
          loading={loading}
          isPremium={isPremium}
          areaId={resolvedAreaId}
          query={query}
        />
      ) : loading ? (
        <LearnCollectionSkeleton />
      ) : (
        <div className="learn-empty">
          Collection not found.{" "}
          <BrowseFolderLink path={{}} href="/learn" className="text-[var(--accent)]">
            Back to Explore
          </BrowseFolderLink>
          .
        </div>
      )}
    </ExploreWorkspaceShell>
  );
}

function ExploreHomeContent({
  subjects,
  loading,
  featured,
  catalogGoal,
}: {
  subjects: Subject[];
  loading: boolean;
  featured: Subject[];
  catalogGoal: StudyGoal;
}) {
  const areas = visibleExploreAreasForGoal(subjects, catalogGoal);
  const shownAreas = areas.length > 0 ? areas : visibleExploreAreas(subjects);
  const shownFeatured =
    featured.length > 0 ? featured : featuredExploreCollections(subjects);

  return (
    <>
      <p className="text-sm text-[var(--text-muted)] leading-relaxed max-w-2xl -mt-2 mb-2">
        Search generated study pages or browse by area. When something is
        useful, open it and save a copy into your own Library.
      </p>

      {loading && subjects.length === 0 ? (
        <LearnCatalogSkeleton cards={4} />
      ) : null}

      {shownAreas.length > 0 ? (
        <section className="explore-section !mt-0">
          <div className="explore-section-head">
            <h2 className="explore-section-title">Browse by area</h2>
            <p className="explore-section-copy">
              Choose a broad context, then narrow down.
            </p>
          </div>
          <div className="explore-area-grid">
            {shownAreas.map((area) => {
              const groups = subjectsForArea(subjects, area.id, catalogGoal);
              const articles = countAreaItems(subjects, area.id, catalogGoal);
              return (
                <BrowseFolderLink
                  key={area.id}
                  path={{ areaId: area.id }}
                  href={learnAreaHref(area.id)}
                  className="explore-area-card"
                >
                  <ExploreAreaIcon tone={area.tone} />
                  <p className="explore-area-title">{area.title}</p>
                  <p className="explore-area-copy">{area.description}</p>
                  <p className="explore-area-count">
                    {groups.length} group{groups.length === 1 ? "" : "s"} ·{" "}
                    {articles} article{articles === 1 ? "" : "s"}
                  </p>
                </BrowseFolderLink>
              );
            })}
          </div>
        </section>
      ) : null}

      {shownFeatured.length > 0 ? (
        <section className="explore-section">
          <div className="explore-section-head">
            <h2 className="explore-section-title">Public collections</h2>
            <p className="explore-section-copy">
              Useful generated collections already available on Shelf.
            </p>
          </div>
          <div className="explore-collection-grid">
            {shownFeatured.map((s) => (
              <BrowseFolderLink
                key={s.id}
                path={withResolvedArea({ subjectSlug: s.slug }, subjects)}
                href={subjectExploreHref(s.slug)}
                className="explore-collection-card"
              >
                <span className="explore-collection-mark" aria-hidden>
                  {s.icon || s.name.charAt(0).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="explore-collection-title">{s.name}</span>
                  <span className="explore-collection-meta">
                    {collectionMeta(s)}
                  </span>
                </span>
              </BrowseFolderLink>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
