import Link from "next/link";

type LearnArticleSeoIntroProps = {
  subjectName: string;
  subjectSlug: string;
  topicTitle: string;
  topicSlug: string;
  articleTitle: string;
  description: string;
};

/** Crawlable article heading + summary (reader UI mounts separately). */
export function LearnArticleSeoIntro({
  subjectName,
  subjectSlug,
  topicTitle,
  topicSlug,
  articleTitle,
  description,
}: LearnArticleSeoIntroProps) {
  return (
    <article className="learn-article-seo-intro" aria-label="Article summary">
      <nav className="learn-article-seo-breadcrumb" aria-label="Breadcrumb">
        <Link href="/learn">Learn</Link>
        <span aria-hidden> / </span>
        <Link href={`/learn/${subjectSlug}`}>{subjectName}</Link>
        <span aria-hidden> / </span>
        <Link href={`/learn/${subjectSlug}/${topicSlug}`}>{topicTitle}</Link>
        <span aria-hidden> / </span>
        <span>{articleTitle}</span>
      </nav>
      <h1 className="learn-article-seo-title">{articleTitle}</h1>
      <p className="learn-article-seo-lead">{description}</p>
    </article>
  );
}
