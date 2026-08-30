"use client";

import Link from "next/link";
import { BookOpen, ChevronRight, FileText, Lock } from "lucide-react";
import { FolderMark } from "@/components/FolderMark";
import { LearnCollectionSkeleton } from "@/components/learn/LearnBrowseSkeletons";
import { LearnMoreTracks } from "@/components/learn/LearnMoreTracks";
import {
  catalogGoalLabel,
  GoalGroup,
  subjectHref,
  topicHref,
} from "@/lib/learnCatalog";
import { learnHref } from "@/lib/learnContent";
import { isPremiumUser } from "@/lib/premium";
import { Subject, Topic } from "@/types";
import { useAuth } from "@/hooks/useAuth";

function TopicRow({
  subjectSlug,
  topic,
}: {
  subjectSlug: string;
  topic: Topic;
}) {
  const articleCount = topic.articles?.length ?? 0;
  return (
    <Link
      href={topicHref(subjectSlug, topic.slug)}
      className="library-row flex items-center gap-3 px-3.5 py-2.5 hover:bg-[var(--bg-secondary)] transition"
    >
      <FolderMark seed={topic.id} size={13} />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-[var(--text-primary)] truncate">
          {topic.title}
        </p>
        <p className="text-[11px] text-[var(--text-muted)]">
          {articleCount} article{articleCount === 1 ? "" : "s"}
        </p>
      </div>
      <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
    </Link>
  );
}

export function LearnCollectionPane({
  subject,
  topicSlug,
  groups,
  featuredGoal,
  loading,
}: {
  subject: Subject | undefined;
  topicSlug?: string;
  groups: GoalGroup[];
  featuredGoal?: GoalGroup["goal"];
  loading: boolean;
}) {
  const { user } = useAuth();
  const isPremium = isPremiumUser(user);
  const topic = topicSlug
    ? subject?.topics.find((t) => t.slug === topicSlug)
    : undefined;

  if (loading && !subject) {
    return (
      <div className="h-full overflow-y-auto px-6 py-6 sm:px-8">
        <LearnCollectionSkeleton />
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="h-full overflow-y-auto px-6 py-6 sm:px-8">
        <div className="learn-empty">
          Collection not found.{" "}
          <Link href="/learn" className="text-[var(--accent)]">
            Back to the study library
          </Link>
          .
        </div>
      </div>
    );
  }

  if (topicSlug && !topic) {
    return (
      <div className="h-full overflow-y-auto px-6 py-6 sm:px-8">
        <div className="learn-empty">
          Topic not found in {subject.name}.{" "}
          <Link
            href={subjectHref(subject.slug)}
            className="text-[var(--accent)]"
          >
            View this collection
          </Link>
          .
        </div>
      </div>
    );
  }

  const articles = topic?.articles ?? [];
  const otherTopics = topic
    ? subject.topics.filter((t) => t.id !== topic.id)
    : [];

  return (
    <div className="h-full overflow-y-auto px-6 py-6 sm:px-8">
      <div className="max-w-4xl">
        <nav className="text-[12px] text-[var(--text-muted)] mb-5 flex items-center gap-1.5 flex-wrap">
          <Link href="/learn" className="hover:text-[var(--accent)]">
            Library
          </Link>
          <ChevronRight className="w-3 h-3" />
          {topic ? (
            <>
              <Link
                href={subjectHref(subject.slug)}
                className="hover:text-[var(--accent)] truncate max-w-[12rem]"
              >
                {subject.name}
              </Link>
              <ChevronRight className="w-3 h-3" />
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

        <div className="mb-6">
          {featuredGoal && (
            <p className="learn-kicker mb-2">
              {catalogGoalLabel(featuredGoal)}
            </p>
          )}
          <div className="flex items-start gap-3">
            {subject.icon ? (
              <span className="text-2xl leading-none mt-0.5" aria-hidden>
                {subject.icon}
              </span>
            ) : (
              <FolderMark seed={subject.id} size={18} />
            )}
            <div className="min-w-0">
              <h1 className="page-title">
                {topic ? topic.title : subject.name}
              </h1>
              {(topic?.description || (!topic && subject.description)) && (
                <p className="page-subtitle mt-2 max-w-2xl">
                  {topic?.description || subject.description}
                </p>
              )}
              <p className="text-[12px] text-[var(--text-muted)] mt-3 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                {topic
                  ? `${articles.length} article${articles.length === 1 ? "" : "s"}`
                  : `${subject.topics.length} topic${subject.topics.length === 1 ? "" : "s"}`}
              </p>
            </div>
          </div>
        </div>

        {topic ? (
          articles.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">
              No articles in this topic yet.
            </p>
          ) : (
            <div className="rounded-[10px] border border-[var(--border)] bg-[var(--bg-elevated)] overflow-hidden">
              {articles.map((article, index) => (
                <Link
                  key={article.id}
                  href={learnHref(subject.slug, topic.slug, article.slug)}
                  className="library-row flex items-center gap-3 px-3.5 py-2.5 border-b border-[var(--border-subtle)] last:border-b-0"
                >
                  <span className="text-[10px] font-mono text-[var(--text-muted)] w-5 tabular-nums">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="w-8 h-8 rounded-md bg-[var(--accent-light)] text-[var(--accent)] flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </span>
                  <span className="flex-1 min-w-0 text-[13px] font-medium truncate">
                    {article.title}
                  </span>
                  {article.isPremium && !isPremium && (
                    <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  )}
                  <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                </Link>
              ))}
            </div>
          )
        ) : subject.topics.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">
            No topics in this collection yet.
          </p>
        ) : (
          <div className="rounded-[10px] border border-[var(--border)] bg-[var(--bg-elevated)] overflow-hidden divide-y divide-[var(--border-subtle)]">
            {subject.topics.map((t) => (
              <TopicRow key={t.id} subjectSlug={subject.slug} topic={t} />
            ))}
          </div>
        )}

        {otherTopics.length > 0 && (
          <section className="mt-8">
            <h2 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-3">
              More in {subject.name}
            </h2>
            <div className="rounded-[10px] border border-[var(--border)] bg-[var(--bg-elevated)] overflow-hidden divide-y divide-[var(--border-subtle)]">
              {otherTopics.map((t) => (
                <TopicRow key={t.id} subjectSlug={subject.slug} topic={t} />
              ))}
            </div>
          </section>
        )}

        <LearnMoreTracks
          groups={groups}
          featuredGoal={featuredGoal}
          excludeSubjectSlug={subject.slug}
        />

        {!user && (
          <p className="mt-10 mb-4 text-[12px] text-[var(--text-muted)]">
            This is the preloaded library — the same explorer after you{" "}
            <Link href="/login" className="text-[var(--accent)] hover:underline">
              sign in
            </Link>
            , plus your own uploads, highlights, and Study AI.
          </p>
        )}
      </div>
    </div>
  );
}
