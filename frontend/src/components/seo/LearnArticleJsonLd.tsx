import { getSiteUrl } from "@/lib/siteUrl";
import { STUDY_GOAL_LABELS } from "@/lib/studyGoal";
import { StudyGoal } from "@/types";

type LearnArticleJsonLdProps = {
  title: string;
  description: string;
  path: string;
  subjectName: string;
  topicName: string;
  studyGoal?: StudyGoal | null;
};

export function LearnArticleJsonLd({
  title,
  description,
  path,
  subjectName,
  topicName,
  studyGoal,
}: LearnArticleJsonLdProps) {
  const url = `${getSiteUrl()}${path}`;
  const aboutName =
    studyGoal && studyGoal !== "GENERAL"
      ? STUDY_GOAL_LABELS[studyGoal]
      : subjectName;

  const data = {
    "@context": "https://schema.org",
    "@type": ["Article", "LearningResource"],
    headline: title,
    description,
    url,
    learningResourceType: "Reference material",
    about: {
      "@type": "Thing",
      name: aboutName,
    },
    isPartOf: {
      "@type": "WebPage",
      name: `${topicName} — ${subjectName}`,
      isPartOf: {
        "@type": "WebSite",
        name: "Shelf Learn",
        url: `${getSiteUrl()}/learn`,
      },
    },
    publisher: {
      "@type": "Organization",
      name: "Shelf",
      url: getSiteUrl(),
    },
    inLanguage: "en-IN",
    isAccessibleForFree: true,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
