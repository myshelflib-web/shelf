"use client";

import { ChevronRight } from "lucide-react";
import { BrowseFolderLink } from "@/components/learn/BrowseFolderLink";
import { ExploreResourceCard } from "@/components/learn/explore/ExploreResourceCard";
import { LearnCatalogSkeleton } from "@/components/learn/LearnBrowseSkeletons";
import {
  ExploreAreaId,
  areaGroupsSection,
  collectionMeta,
  getExploreArea,
  listAreaResources,
  subjectExploreHref,
  subjectsForArea,
} from "@/lib/exploreCatalog";
import { withResolvedArea } from "@/lib/preloadedBrowse";
import { Subject } from "@/types";

export function ExploreAreaContent({
  areaId,
  subjects,
  resources,
  loading,
  query,
}: {
  areaId: ExploreAreaId;
  subjects: Subject[];
  resources: ReturnType<typeof listAreaResources>;
  loading: boolean;
  query: string;
}) {
  const area = getExploreArea(areaId);
  const groups = subjectsForArea(subjects, areaId);
  const groupsSection = areaGroupsSection(areaId);
  const searching = Boolean(query.trim());

  return (
    <>
      <header className="explore-scoped-head !items-start mb-2">
        <div className="min-w-0 flex-1">
          <BrowseFolderLink
            path={{}}
            href="/learn"
            className="explore-back-library mb-2 inline-flex w-auto"
          >
            ← Explore
          </BrowseFolderLink>
          <nav className="explore-breadcrumb" aria-label="Breadcrumb">
            <BrowseFolderLink path={{}} href="/learn" className="hover:text-[var(--accent)]">
              Explore
            </BrowseFolderLink>
            <ChevronRight className="w-3 h-3" aria-hidden />
            <span className="text-[var(--text-secondary)]">{area.title}</span>
          </nav>
          <h1 className="page-title mt-2">{area.title}</h1>
          <p className="page-subtitle mt-2 max-w-2xl">{area.description}</p>
        </div>
      </header>

      {searching ? (
        <section className="explore-section !mt-4">
          <div className="explore-section-head">
            <h2 className="explore-section-title">Search results</h2>
            <p className="explore-section-copy">
              Matching articles in {area.title}.
            </p>
          </div>
          {loading && resources.length === 0 ? (
            <LearnCatalogSkeleton cards={4} />
          ) : resources.length === 0 ? (
            <div className="learn-empty">
              No matches for “{query.trim()}” in {area.title}.
            </div>
          ) : (
            <div className="explore-resource-grid">
              {resources.map((r) => (
                <ExploreResourceCard key={r.id} {...r} />
              ))}
            </div>
          )}
        </section>
      ) : (
        <section className="explore-section !mt-4">
          <div className="explore-section-head">
            <h2 className="explore-section-title">{groupsSection.title}</h2>
            <p className="explore-section-copy">{groupsSection.copy}</p>
          </div>
          {loading && groups.length === 0 ? (
            <LearnCatalogSkeleton cards={4} />
          ) : groups.length === 0 ? (
            <div className="learn-empty">No public material in this area yet.</div>
          ) : (
            <div className="explore-collection-grid">
              {groups.map((subject) => (
                <BrowseFolderLink
                  key={subject.id}
                  path={withResolvedArea(
                    { areaId, subjectSlug: subject.slug },
                    subjects
                  )}
                  href={subjectExploreHref(subject.slug)}
                  className="explore-collection-card"
                >
                  <span className="explore-collection-mark" aria-hidden>
                    {subject.icon || subject.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0">
                    <span className="explore-collection-title">{subject.name}</span>
                    <span className="explore-collection-meta">
                      {collectionMeta(subject)}
                    </span>
                  </span>
                </BrowseFolderLink>
              ))}
            </div>
          )}
        </section>
      )}
    </>
  );
}
