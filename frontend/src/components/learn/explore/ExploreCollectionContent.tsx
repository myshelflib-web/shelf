"use client";

import { useMemo } from "react";
import { ChevronRight, Lock } from "lucide-react";
import { BrowseFolderLink } from "@/components/learn/BrowseFolderLink";
import { ExploreResourceCard } from "@/components/learn/explore/ExploreResourceCard";
import { LearnCatalogSkeleton } from "@/components/learn/LearnBrowseSkeletons";
import {
  ExploreAreaId,
  getExploreArea,
  learnAreaHref,
  listAreaResources,
} from "@/lib/exploreCatalog";
import { catalogGoalLabel, subjectGoal, subjectHref, topicHref } from "@/lib/learnCatalog";
import {
  isOfficialSyllabusSubject,
  syllabusTopicsFromSubject,
} from "@/lib/officialSyllabus";
import { Subject, Topic } from "@/types";

export function ExploreCollectionContent({
  subject,
  topic,
  resources,
  loading,
  isPremium,
  areaId,
  query,
}: {
  subject: Subject;
  topic?: Topic;
  resources: ReturnType<typeof listAreaResources>;
  loading: boolean;
  isPremium: boolean;
  areaId?: ExploreAreaId | null;
  query: string;
}) {
  const goal = subjectGoal(subject);
  const area = areaId ? getExploreArea(areaId) : null;
  const backPath = topic
    ? { areaId, subjectSlug: subject.slug }
    : areaId
      ? { areaId }
      : {};
  const backHref = topic
    ? subjectHref(subject.slug)
    : areaId
      ? learnAreaHref(areaId)
      : "/learn";
  const backLabel = topic ? subject.name : area ? area.title : "Explore";

  const visibleTopics = useMemo(() => {
    const syllabusOnly =
      areaId === "syllabus" && !isOfficialSyllabusSubject(subject);
    const topics = syllabusOnly
      ? syllabusTopicsFromSubject(subject)
      : subject.topics;
    const needle = query.trim().toLowerCase();
    if (!needle) return topics;
    return topics.filter(
      (t) =>
        t.title.toLowerCase().includes(needle) ||
        (t.articles ?? []).some((a) => a.title.toLowerCase().includes(needle))
    );
  }, [areaId, query, subject]);

  const showTopics = !topic && visibleTopics.length > 0;
  const showArticles =
    Boolean(topic) || (Boolean(query.trim()) && resources.length > 0);

  return (
    <>
      <header className="explore-scoped-head !items-start mb-2">
        <div className="min-w-0 flex-1">
          <BrowseFolderLink
            path={backPath}
            href={backHref}
            className="explore-back-library mb-2 inline-flex w-auto"
          >
            ← {backLabel}
          </BrowseFolderLink>
          <nav className="explore-breadcrumb" aria-label="Breadcrumb">
            <BrowseFolderLink path={{}} href="/learn" className="hover:text-[var(--accent)]">
              Explore
            </BrowseFolderLink>
            <ChevronRight className="w-3 h-3" aria-hidden />
            {area && !topic ? (
              <>
                <BrowseFolderLink
                  path={{ areaId: areaId! }}
                  href={learnAreaHref(areaId!)}
                  className="hover:text-[var(--accent)] truncate max-w-[10rem]"
                >
                  {area.title}
                </BrowseFolderLink>
                <ChevronRight className="w-3 h-3" aria-hidden />
              </>
            ) : null}
            {topic ? (
              <>
                <BrowseFolderLink
                  path={{ areaId, subjectSlug: subject.slug }}
                  href={subjectHref(subject.slug)}
                  className="hover:text-[var(--accent)] truncate max-w-[10rem]"
                >
                  {subject.name}
                </BrowseFolderLink>
                <ChevronRight className="w-3 h-3" aria-hidden />
                <span className="text-[var(--text-secondary)] truncate">
                  {topic.title}
                </span>
              </>
            ) : (
              <span className="text-[var(--text-secondary)] truncate">
                {subject.name}
              </span>
            )}
          </nav>
          <p className="learn-kicker mt-2">{catalogGoalLabel(goal)}</p>
          <h1 className="page-title mt-1">
            {topic ? topic.title : subject.name}
          </h1>
          <p className="page-subtitle mt-2 max-w-2xl">
            {topic?.description ||
              subject.description ||
              "Browse topics in this collection, then open articles to read or save a copy."}
          </p>
        </div>
      </header>

      {showTopics ? (
        <section className="explore-section !mt-4">
          <div className="explore-section-head">
            <h2 className="explore-section-title">Topics</h2>
            <p className="explore-section-copy">
              {visibleTopics.length} topic
              {visibleTopics.length === 1 ? "" : "s"} in this collection
            </p>
          </div>
          <div className="explore-collection-grid">
            {visibleTopics.map((t) => {
              const count = t.articles?.length ?? 0;
              return (
                <BrowseFolderLink
                  key={t.id}
                  path={{
                    areaId,
                    subjectSlug: subject.slug,
                    topicSlug: t.slug,
                  }}
                  href={topicHref(subject.slug, t.slug)}
                  className="explore-collection-card"
                >
                  <span className="explore-collection-mark" aria-hidden>
                    {String(t.title.charAt(0).toUpperCase())}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="explore-collection-title">{t.title}</span>
                    <span className="explore-collection-meta">
                      {count} article{count === 1 ? "" : "s"}
                    </span>
                  </span>
                </BrowseFolderLink>
              );
            })}
          </div>
        </section>
      ) : null}

      {showArticles ? (
        <section className="explore-section">
          <div className="explore-section-head">
            <h2 className="explore-section-title">
              {topic ? "Articles" : "Matching articles"}
            </h2>
            <p className="explore-section-copy">
              Open a resource to read it before saving.
            </p>
          </div>
          {loading && resources.length === 0 ? (
            <LearnCatalogSkeleton cards={4} />
          ) : resources.length === 0 ? (
            <div className="learn-empty">No articles in this view yet.</div>
          ) : (
            <div className="explore-resource-grid">
              {resources.map((r) => {
                const article = subject.topics
                  .flatMap((t) => t.articles ?? [])
                  .find((a) => a.id === r.id);
                const locked = article?.isPremium && !isPremium;
                return (
                  <div key={r.id} className="relative">
                    <ExploreResourceCard {...r} />
                    {locked ? (
                      <span className="absolute top-3 right-3 inline-flex items-center gap-1 text-[10px] text-amber-500">
                        <Lock className="w-3 h-3" />
                        Premium
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      ) : null}
    </>
  );
}
