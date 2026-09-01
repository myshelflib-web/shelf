"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Lock } from "lucide-react";
import { ExploreWorkspaceShell } from "@/components/learn/explore/ExploreWorkspaceShell";
import { ExploreAreaIcon } from "@/components/learn/explore/ExploreAreaIcon";
import { ExploreResourceCard } from "@/components/learn/explore/ExploreAreaPane";
import { useLearnSubjects } from "@/hooks/useLearnSubjects";
import { useAuth } from "@/hooks/useAuth";
import { isPremiumUser } from "@/lib/premium";
import {
  EXPLORE_AREAS,
  ExploreAreaId,
  collectionMeta,
  countAreaItems,
  featuredExploreCollections,
  getExploreArea,
  learnAreaHref,
  listAreaResources,
  subjectExploreHref,
} from "@/lib/exploreCatalog";
import {
  catalogGoalLabel,
  searchLearnCatalog,
  subjectGoal,
  subjectHref,
  topicHref,
} from "@/lib/learnCatalog";
import { learnHref } from "@/lib/learnContent";
import { Subject, Topic } from "@/types";
import { useEffect, useMemo, useState } from "react";

function scopedSearchPlaceholder(opts: {
  areaId?: ExploreAreaId | null;
  subject?: Subject;
  topic?: Topic;
}): string {
  if (opts.topic) return `Search in ${opts.topic.title}…`;
  if (opts.subject) return `Search in ${opts.subject.name}…`;
  if (opts.areaId) return `Search within ${getExploreArea(opts.areaId).title}…`;
  return "Search syllabus, reports, textbooks, notes, PYQs…";
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
  returnTo,
}: {
  subjectSlug?: string;
  topicSlug?: string;
  areaId?: ExploreAreaId | null;
  returnTo: string;
}) {
  const router = useRouter();
  const { user } = useAuth();
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

  const searchSubjects = useMemo(() => {
    if (subject) return [subject];
    if (areaId) {
      const goals = new Set(getExploreArea(areaId).goals);
      return subjects.filter((s) => goals.has(subjectGoal(s)));
    }
    return subjects;
  }, [subjects, subject, areaId]);

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
      return listAreaResources(subjects, areaId, { query });
    }
    if (subject) {
      const items = listAreaResources(subjects, areaForSubject(subject), {
        subjectSlug: subject.slug,
        topicSlug: topic?.slug,
        query,
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
          });
        }
      }
      return manual;
    }
    return [];
  }, [subjects, areaId, subject, topic, query, subjectSlug]);

  const featured = featuredExploreCollections(subjects);
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
      onOpenSearchHit={(href) => router.push(href)}
      showSuggestChips={isHome}
    >
      {isHome ? (
        <ExploreHomeContent subjects={subjects} loading={loading} featured={featured} />
      ) : areaId && !subjectSlug ? (
        <ExploreAreaContent areaId={areaId} resources={resources} loading={loading} />
      ) : subject ? (
        <ExploreCollectionContent
          subject={subject}
          topic={topic}
          resources={resources}
          loading={loading}
          isPremium={isPremium}
        />
      ) : loading ? (
        <p className="text-sm text-[var(--text-muted)]">Loading…</p>
      ) : (
        <div className="learn-empty">
          Collection not found.{" "}
          <Link href="/learn" className="text-[var(--accent)]">
            Back to Explore
          </Link>
          .
        </div>
      )}
    </ExploreWorkspaceShell>
  );
}

function areaForSubject(subject: Subject): ExploreAreaId {
  const goal = subjectGoal(subject);
  if (goal === "JUDICIARY") return "law";
  if (goal === "NEET_PG") return "medicine";
  if (goal === "GATE") return "engineering";
  if (goal === "UPSC" || goal === "STATE_PCS") return "policy";
  return "exams";
}

function ExploreHomeContent({
  subjects,
  loading,
  featured,
}: {
  subjects: Subject[];
  loading: boolean;
  featured: Subject[];
}) {
  const router = useRouter();

  return (
    <>
      <p className="text-sm text-[var(--text-muted)] leading-relaxed max-w-2xl -mt-2 mb-2">
        Search the public knowledge catalog or browse by broad area. When
        something is useful, open it and save a copy into your own Library.
      </p>

      <section className="explore-section !mt-0">
        <div className="explore-section-head">
          <h2 className="explore-section-title">Browse by area</h2>
          <p className="explore-section-copy">
            Choose a broad context, then narrow down.
          </p>
        </div>
        <div className="explore-area-grid">
          {EXPLORE_AREAS.map((area) => (
            <button
              key={area.id}
              type="button"
              onClick={() => router.push(learnAreaHref(area.id))}
              className="explore-area-card"
            >
              <ExploreAreaIcon tone={area.tone} />
              <p className="explore-area-title">{area.title}</p>
              <p className="explore-area-copy">{area.description}</p>
              {!loading && countAreaItems(subjects, area.id) > 0 ? (
                <p className="explore-area-count">
                  {countAreaItems(subjects, area.id)} articles
                </p>
              ) : null}
            </button>
          ))}
        </div>
      </section>

      {featured.length > 0 ? (
        <section className="explore-section">
          <div className="explore-section-head">
            <h2 className="explore-section-title">Public collections</h2>
            <p className="explore-section-copy">
              Useful indexed collections already available on Shelf.
            </p>
          </div>
          <div className="explore-collection-grid">
            {featured.map((s) => (
              <Link
                key={s.id}
                href={subjectExploreHref(s.slug)}
                className="explore-collection-card"
              >
                <span className="explore-collection-mark" aria-hidden>
                  {s.icon || s.name.charAt(0).toUpperCase()}
                </span>
                <span className="min-w-0">
                  <span className="explore-collection-title">{s.name}</span>
                  <span className="explore-collection-meta">
                    {collectionMeta(s)}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}

function ExploreAreaContent({
  areaId,
  resources,
  loading,
}: {
  areaId: ExploreAreaId;
  resources: ReturnType<typeof listAreaResources>;
  loading: boolean;
}) {
  const area = getExploreArea(areaId);

  return (
    <>
      <header className="explore-scoped-head !items-start mb-2">
        <div className="min-w-0 flex-1">
          <nav className="explore-breadcrumb" aria-label="Breadcrumb">
            <Link href="/learn" className="hover:text-[var(--accent)]">
              Explore
            </Link>
            <ChevronRight className="w-3 h-3" aria-hidden />
            <span className="text-[var(--text-secondary)]">{area.title}</span>
          </nav>
          <h1 className="page-title mt-2">{area.title}</h1>
          <p className="page-subtitle mt-2 max-w-2xl">{area.description}</p>
        </div>
      </header>

      <section className="explore-section !mt-4">
        <div className="explore-section-head">
          <h2 className="explore-section-title">Available material</h2>
          <p className="explore-section-copy">
            Open a resource to read it before saving.
          </p>
        </div>
        {loading && resources.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">Loading catalog…</p>
        ) : resources.length === 0 ? (
          <div className="learn-empty">No public material in this area yet.</div>
        ) : (
          <div className="explore-resource-grid">
            {resources.map((r) => (
              <ExploreResourceCard key={r.id} {...r} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function ExploreCollectionContent({
  subject,
  topic,
  resources,
  loading,
  isPremium,
}: {
  subject: Subject;
  topic?: Topic;
  resources: ReturnType<typeof listAreaResources>;
  loading: boolean;
  isPremium: boolean;
}) {
  const goal = subjectGoal(subject);

  return (
    <>
      <header className="explore-scoped-head !items-start mb-2">
        <div className="min-w-0 flex-1">
          <nav className="explore-breadcrumb" aria-label="Breadcrumb">
            <Link href="/learn" className="hover:text-[var(--accent)]">
              Explore
            </Link>
            <ChevronRight className="w-3 h-3" aria-hidden />
            {topic ? (
              <>
                <Link
                  href={subjectHref(subject.slug)}
                  className="hover:text-[var(--accent)] truncate max-w-[10rem]"
                >
                  {subject.name}
                </Link>
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
              "Browse public material in this collection. Open any file to read it, then save a copy to your Library."}
          </p>
        </div>
      </header>

      {!topic && subject.topics.length > 0 ? (
        <section className="explore-section !mt-4">
          <div className="explore-section-head">
            <h2 className="explore-section-title">Topics</h2>
            <p className="explore-section-copy">
              {subject.topics.length} topic
              {subject.topics.length === 1 ? "" : "s"} in this collection
            </p>
          </div>
          <div className="explore-collection-grid">
            {subject.topics.map((t) => {
              const count = t.articles?.length ?? 0;
              return (
                <Link
                  key={t.id}
                  href={topicHref(subject.slug, t.slug)}
                  className="explore-collection-card"
                >
                  <span className="explore-collection-mark" aria-hidden>
                    {String(t.title.charAt(0).toUpperCase())}
                  </span>
                  <span className="min-w-0">
                    <span className="explore-collection-title">{t.title}</span>
                    <span className="explore-collection-meta">
                      {count} article{count === 1 ? "" : "s"}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="explore-section">
        <div className="explore-section-head">
          <h2 className="explore-section-title">
            {topic ? "Articles" : "All material"}
          </h2>
          <p className="explore-section-copy">
            Open a resource to read it before saving.
          </p>
        </div>
        {loading && resources.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">Loading…</p>
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
    </>
  );
}
