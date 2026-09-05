"use client";

import Link from "next/link";
import { ChevronDown, ChevronRight, Folder, Newspaper } from "lucide-react";
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
import { withResolvedArea } from "@/lib/preloadedBrowse";
import { StudyGoal, Subject, Topic } from "@/types";

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

export function ExploreSidebarHomeTree({
  activeArea,
  activeSubject,
  activeTopic,
  searchQuery = "",
  studyGoal = "GENERAL",
}: {
  activeArea?: ExploreAreaId | null;
  activeSubject?: string | null;
  activeTopic?: string | null;
  searchQuery?: string;
  studyGoal?: StudyGoal;
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
          <Newspaper className="w-4 h-4 text-[var(--accent)] shrink-0" />
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
            searchQuery={searchQuery}
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
  searchQuery,
}: {
  area: ExploreAreaDef;
  subjects: Subject[];
  expanded: boolean;
  activeSubject?: string | null;
  activeTopic?: string | null;
  searchQuery: string;
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
              searchQuery={searchQuery}
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
  searchQuery,
}: {
  subject: Subject;
  areaId: ExploreAreaId;
  expanded: boolean;
  activeTopic?: string | null;
  searchQuery: string;
}) {
  const topics = subject.topics.filter((topic) =>
    topicMatchesQuery(topic, searchQuery)
  );
  const collectionActive = expanded && !activeTopic;

  return (
    <div>
      <BrowseFolderLink
        path={{ areaId, subjectSlug: subject.slug }}
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
          {topics.map((topic) => {
            const count = topic.articles?.length ?? 0;
            const isActive = activeTopic === topic.slug;
            return (
              <BrowseFolderLink
                key={topic.id}
                path={{
                  areaId,
                  subjectSlug: subject.slug,
                  topicSlug: topic.slug,
                }}
                href={topicHref(subject.slug, topic.slug)}
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
      ) : null}
    </div>
  );
}
