"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Folder } from "lucide-react";
import { ExploreAreaIcon } from "@/components/learn/explore/ExploreAreaIcon";
import { useAuth } from "@/hooks/useAuth";
import { useLearnSubjects } from "@/hooks/useLearnSubjects";
import {
  EXPLORE_AREAS,
  ExploreAreaId,
  areaSidebarRows,
  countAreaItems,
  featuredExploreCollections,
  isExploreAreaId,
  learnAreaHref,
  subjectExploreHref,
} from "@/lib/exploreCatalog";

export function ExploreSidebarBrowse({
  mode,
  activeArea,
  activeSubject,
  onGuestLibraryClick,
}: {
  mode: "home" | "area" | "collection";
  activeArea?: ExploreAreaId | null;
  activeSubject?: string | null;
  onGuestLibraryClick?: () => void;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const { subjects } = useLearnSubjects();
  const featured = featuredExploreCollections(subjects);
  const scopedRows = activeArea ? areaSidebarRows(subjects, activeArea) : [];

  return (
    <div className="px-1.5 pb-2">
      <button
        type="button"
        onClick={() => {
          if (!user) {
            onGuestLibraryClick?.();
            return;
          }
          router.push("/my-content");
        }}
        className="explore-back-library"
      >
        ← My Library
      </button>
      <p className="px-1.5 pt-1 pb-2 text-sm font-semibold text-[var(--text-primary)]">
        Explore
      </p>
      <div className="h-px bg-[var(--border-subtle)] -mx-1.5 mb-2" />

      {mode === "collection" && activeSubject ? (
        <div>
          <Link href="/learn" className="explore-side-row text-[var(--text-muted)]">
            ← Back to Explore
          </Link>
          <p className="explore-side-label mt-2">Collection</p>
        </div>
      ) : mode === "home" ? (
        <>
          <div className="mt-1">
            <p className="explore-side-label">Browse</p>
            {EXPLORE_AREAS.map((area) => {
              const count = countAreaItems(subjects, area.id);
              return (
                <Link
                  key={area.id}
                  href={learnAreaHref(area.id)}
                  className="explore-side-row"
                >
                  <ExploreAreaIcon tone={area.tone} size="sm" />
                  <span className="min-w-0 flex-1 truncate">{area.title}</span>
                  {count > 0 ? (
                    <span className="explore-side-count">{count}</span>
                  ) : null}
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
          <Link href="/learn" className="explore-side-row text-[var(--text-muted)]">
            ← Back to Explore
          </Link>
          <p className="explore-side-label mt-2">
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
