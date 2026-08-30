"use client";

import { LearnSubjectCard } from "@/components/learn/LearnSubjectCard";
import { catalogGoalLabel, GoalGroup } from "@/lib/learnCatalog";
import { StudyGoal } from "@/types";

export function LearnMoreTracks({
  groups,
  featuredGoal,
  excludeSubjectSlug,
}: {
  groups: GoalGroup[];
  featuredGoal?: StudyGoal;
  excludeSubjectSlug?: string;
}) {
  const moreInTrack = groups.find((g) => g.goal === featuredGoal);
  const siblings =
    moreInTrack?.subjects.filter((s) => s.slug !== excludeSubjectSlug) ?? [];
  const otherTracks = groups.filter((g) => g.goal !== featuredGoal);

  if (siblings.length === 0 && otherTracks.length === 0) return null;

  return (
    <div className="space-y-8 mt-10">
      {siblings.length > 0 && featuredGoal && (
        <section>
          <h2 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-3">
            More in {catalogGoalLabel(featuredGoal)}
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 items-stretch">
            {siblings.map((subject) => (
              <li key={subject.id} className="h-full">
                <LearnSubjectCard subject={subject} compact />
              </li>
            ))}
          </ul>
        </section>
      )}

      {otherTracks.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-4">
            Other tracks
          </p>
          <div className="space-y-8">
            {otherTracks.map((group) => (
              <section key={group.goal}>
                <h3 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-3">
                  {catalogGoalLabel(group.goal)}
                </h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 items-stretch">
                  {group.subjects.map((subject) => (
                    <li key={subject.id} className="h-full">
                      <LearnSubjectCard subject={subject} compact />
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
