import { getSiteUrl } from "@/lib/siteUrl";
import { QUIZ_DESCRIPTION, QUIZ_TITLE } from "@/lib/seo/keywords";

export function QuizJsonLd() {
  const siteUrl = getSiteUrl();
  const page = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: QUIZ_TITLE,
    url: `${siteUrl}/quiz`,
    description: QUIZ_DESCRIPTION,
    isPartOf: {
      "@type": "WebSite",
      name: "Shelf",
      url: siteUrl,
    },
    about: {
      "@type": "SoftwareApplication",
      name: "Shelf Quiz",
      applicationCategory: "EducationalApplication",
      operatingSystem: "Web",
      url: `${siteUrl}/quiz`,
      featureList: [
        "Exam-style MCQs from your PDFs",
        "Written answers with LaTeX",
        "Photo of handwritten working",
        "PYQ-style exam bank",
        "Syllabus-mapped papers",
      ],
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(page) }}
    />
  );
}
