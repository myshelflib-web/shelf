import { getSiteUrl } from "@/lib/siteUrl";
import { learnTrackPath } from "@/lib/seo/learnTrackSeo";
import { STUDY_GOAL_LABELS } from "@/lib/studyGoal";
import { StudyGoal } from "@/types";

type LearnTrackJsonLdProps = {
  goal: Exclude<StudyGoal, "GENERAL">;
  description: string;
  subjects: Array<{
    name: string;
    slug: string;
    topics: Array<{ title: string; slug: string }>;
  }>;
};

export function LearnTrackJsonLd({
  goal,
  description,
  subjects,
}: LearnTrackJsonLdProps) {
  const siteUrl = getSiteUrl();
  const path = learnTrackPath(goal);
  const url = `${siteUrl}${path}`;
  const label = STUDY_GOAL_LABELS[goal];

  const items = subjects.flatMap((subject) =>
    subject.topics.map((topic) => ({
      "@type": "ListItem",
      name: `${topic.title} — ${subject.name}`,
      url: `${siteUrl}/learn/${subject.slug}/${topic.slug}`,
    }))
  );

  const data = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${label} — free study curriculum`,
    description,
    url,
    inLanguage: "en-IN",
    isPartOf: {
      "@type": "WebSite",
      name: "Shelf Learn",
      url: `${siteUrl}/learn`,
    },
    about: {
      "@type": "Thing",
      name: label,
    },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: items.length,
      itemListElement: items.slice(0, 50),
    },
    isAccessibleForFree: true,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
