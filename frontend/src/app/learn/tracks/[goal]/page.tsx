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
      <section className="learn-track-seo-intro" aria-label="About this track">
        <div className="learn-track-seo-inner">
          <nav className="learn-track-seo-breadcrumb" aria-label="Breadcrumb">
            <Link href="/learn">Learn</Link>
            <span aria-hidden> / </span>
            <span>{seo.h1}</span>
          </nav>
          <h1 className="learn-track-seo-title">{seo.h1}</h1>
          <p className="learn-track-seo-lead">{seo.intro}</p>
          <p className="learn-track-seo-note">
            All articles open in the reader without sign-in.{" "}
            <Link href="/login">Sign in</Link> to save highlights and build a
            private library on <Link href="/my-content">My Content</Link>.
          </p>
          {seo.faqs.length > 0 && (
            <div className="learn-track-seo-faq">
              <h2 className="learn-track-seo-faq-title">Common questions</h2>
              <dl className="learn-track-seo-faq-list">
                {seo.faqs.map((faq) => (
                  <div key={faq.question} className="learn-track-seo-faq-item">
                    <dt>{faq.question}</dt>
                    <dd>{faq.answer}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </section>
      <LearnTrackBrowse goal={goal} />
    </>
  );
}
