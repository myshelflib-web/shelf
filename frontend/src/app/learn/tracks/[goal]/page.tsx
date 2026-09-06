import Link from "next/link";
import { notFound } from "next/navigation";
import { LearnTrackBrowse } from "@/components/learn/LearnTrackBrowse";
import { FaqJsonLd } from "@/components/seo/FaqJsonLd";
import {
  LEARN_TRACK_SEO,
  goalFromTrackSlug,
} from "@/lib/seo/learnTrackSeo";

type PageProps = {
  params: Promise<{ goal: string }>;
};

export default async function LearnTrackPage({ params }: PageProps) {
  const { goal: slug } = await params;
  const goal = goalFromTrackSlug(slug);
  if (!goal) notFound();

  const seo = LEARN_TRACK_SEO[goal];

  return (
    <>
      <FaqJsonLd faqs={seo.faqs} />
      {/* Crawl-only — same visually-hidden pattern as Learn article SEO intros. */}
      <article className="learn-article-seo-intro" aria-label="About this track">
        <nav className="learn-article-seo-breadcrumb" aria-label="Breadcrumb">
          <Link href="/learn">Learn</Link>
          <span aria-hidden> / </span>
          <span>{seo.h1}</span>
        </nav>
        <h1 className="learn-article-seo-title">{seo.h1}</h1>
        <p className="learn-article-seo-lead">{seo.intro}</p>
        <p>
          All articles open in the reader without sign-in.{" "}
          <Link href="/login">Sign in</Link> to save highlights and build a
          private library on <Link href="/my-content">My Content</Link>.
        </p>
        {seo.faqs.length > 0 ? (
          <section>
            <h2>Common questions</h2>
            <dl>
              {seo.faqs.map((faq) => (
                <div key={faq.question}>
                  <dt>{faq.question}</dt>
                  <dd>{faq.answer}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}
      </article>
      <div className="h-full">
        <LearnTrackBrowse goal={goal} />
      </div>
    </>
  );
}
