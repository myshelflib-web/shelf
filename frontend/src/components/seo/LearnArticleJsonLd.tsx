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
  dateModified?: string | null;
  sourceUrl?: string | null;
  isPdf?: boolean;
};

export function LearnArticleJsonLd({
  title,
  description,
  path,
  subjectName,
  topicName,
  studyGoal,
  dateModified,
  sourceUrl,
  isPdf,
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
    mainEntityOfPage: url,
    ...(dateModified ? { dateModified } : {}),
    learningResourceType: isPdf ? "Textbook" : "Reference material",
    ...(isPdf
      ? { encodingFormat: "application/pdf" }
      : sourceUrl
        ? { sameAs: sourceUrl }
        : {}),
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
      logo: {
        "@type": "ImageObject",
        url: `${getSiteUrl()}/icons/shelf-icon-2048.png`,
      },
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
