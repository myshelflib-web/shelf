"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { ExploreHeroSearch } from "@/components/learn/explore/ExploreHeroSearch";
import { ExploreResourceCard } from "@/components/learn/explore/ExploreResourceCard";
import { useLearnSubjects } from "@/hooks/useLearnSubjects";
import {
  ExploreAreaId,
  areaGroupsSection,
  getExploreArea,
  learnAreaHref,
  listAreaResources,
  subjectExploreHref,
  subjectsForArea,
  collectionMeta,
} from "@/lib/exploreCatalog";
import { searchLearnCatalog } from "@/lib/learnCatalog";
import { useEffect, useMemo, useState } from "react";

export { ExploreResourceCard } from "@/components/learn/explore/ExploreResourceCard";

export function ExploreAreaPane({
  areaId,
  subjectSlug,
  topicSlug,
}: {
  areaId: ExploreAreaId;
  subjectSlug?: string;
  topicSlug?: string;
}) {
  const router = useRouter();
  const area = getExploreArea(areaId);
  const { subjects, loading } = useLearnSubjects();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const resources = useMemo(
    () =>
      listAreaResources(subjects, areaId, {
        subjectSlug,
        topicSlug,
        query,
      }),
    [subjects, areaId, subjectSlug, topicSlug, query]
  );

  const areaGroups = useMemo(
    () => subjectsForArea(subjects, areaId),
    [subjects, areaId]
  );
  const groupsSection = areaGroupsSection(areaId);
  const searching = Boolean(query.trim());

  const catalogHits = useMemo(() => {
    const scoped = subjects.filter((s) =>
      getExploreArea(areaId).goals.includes(s.studyGoal ?? "GENERAL")
    );
    return searchLearnCatalog(scoped, query);
  }, [subjects, areaId, query]);

  const hits = query.trim()
    ? catalogHits.length > 0
      ? catalogHits
      : resources.map((r) => ({
          id: r.id,
          title: r.title,
          href: r.href,
          snippet: r.meta,
        }))
    : [];

  useEffect(() => {
    setActive(0);
  }, [query, areaId, subjectSlug, topicSlug]);

  const activeSubject = subjectSlug
    ? subjects.find((s) => s.slug === subjectSlug)
    : undefined;

  return (
    <div className="h-full overflow-y-auto">
      <div className="explore-page-inner">
        <header className="explore-scoped-head">
          <div className="min-w-0 flex-1">
            <Link
              href={activeSubject ? learnAreaHref(areaId) : "/learn"}
              className="explore-back-library mb-2 inline-flex w-auto"
            >
              ← {activeSubject ? area.title : "Explore"}
            </Link>
            <nav className="explore-breadcrumb" aria-label="Breadcrumb">
              <Link href="/learn" className="hover:text-[var(--accent)]">
                Explore
              </Link>
              <ChevronRight className="w-3 h-3" aria-hidden />
              {activeSubject ? (
                <>
                  <Link
                    href={learnAreaHref(areaId)}
                    className="hover:text-[var(--accent)]"
                  >
                    {area.title}
                  </Link>
                  <ChevronRight className="w-3 h-3" aria-hidden />
                  <span className="text-[var(--text-secondary)] truncate">
                    {activeSubject.name}
                  </span>
                </>
              ) : (
                <span className="text-[var(--text-secondary)]">{area.title}</span>
              )}
            </nav>
            <h1 className="page-title mt-2">
              {activeSubject?.name ?? area.title}
            </h1>
            <p className="page-subtitle mt-2 max-w-2xl">
              {activeSubject?.description?.trim() || area.description}
            </p>
          </div>
        </header>

        <div className="mt-5">
          <ExploreHeroSearch
            query={query}
            onQueryChange={setQuery}
            placeholder={`Search within ${area.title}…`}
            scopeLabel={area.title}
            hits={hits}
            searching={loading && Boolean(query.trim())}
            active={active}
            onActiveChange={setActive}
            onOpenHit={(href) => router.push(href)}
          />
        </div>

        <section className="explore-section">
          {searching ? (
            <>
              <div className="explore-section-head">
                <h2 className="explore-section-title">Search results</h2>
                <p className="explore-section-copy">
                  Matching articles in {area.title}.
                </p>
              </div>
              {loading && resources.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)]">Loading catalog…</p>
              ) : resources.length === 0 ? (
                <div className="learn-empty">
                  No matches in {area.title} for “{query.trim()}”.
                </div>
              ) : (
                <div className="explore-resource-grid">
                  {resources.map((resource) => (
                    <ExploreResourceCard key={resource.id} {...resource} />
                  ))}
                </div>
              )}
            </>
          ) : !subjectSlug ? (
            <>
              <div className="explore-section-head">
                <h2 className="explore-section-title">{groupsSection.title}</h2>
                <p className="explore-section-copy">{groupsSection.copy}</p>
              </div>
              {loading && areaGroups.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)]">Loading catalog…</p>
              ) : areaGroups.length === 0 ? (
                <div className="learn-empty">
                  No public material in {area.title} yet.{" "}
                  <Link href="/learn" className="text-[var(--accent)]">
                    Browse all areas
                  </Link>
                  .
                </div>
              ) : (
                <div className="explore-collection-grid">
                  {areaGroups.map((subject) => (
                    <Link
                      key={subject.id}
                      href={subjectExploreHref(subject.slug)}
                      className="explore-collection-card"
                    >
                      <span className="explore-collection-mark" aria-hidden>
                        {subject.icon || subject.name.charAt(0).toUpperCase()}
                      </span>
                      <span className="min-w-0">
                        <span className="explore-collection-title">
                          {subject.name}
                        </span>
                        <span className="explore-collection-meta">
                          {collectionMeta(subject)}
                        </span>
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="explore-section-head">
                <h2 className="explore-section-title">Available material</h2>
                <p className="explore-section-copy">
                  Open a resource to read it before saving.
                </p>
              </div>
              {loading && resources.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)]">Loading catalog…</p>
              ) : resources.length === 0 ? (
                <div className="learn-empty">
                  {query.trim()
                    ? `No matches in ${area.title} for “${query.trim()}”.`
                    : `No public material in ${area.title} yet.`}{" "}
                  <Link href="/learn" className="text-[var(--accent)]">
                    Browse all areas
                  </Link>
                  .
                </div>
              ) : (
                <div className="explore-resource-grid">
                  {resources.map((resource) => (
                    <ExploreResourceCard key={resource.id} {...resource} />
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
