import Link from "next/link";
import { BRAND_FAQS, BRAND_NAME, BRAND_DOMAIN } from "@/lib/seo/brandIdentity";

const VISIBLE_FAQS = BRAND_FAQS.filter(
  (faq) => !/misspell|shel, sheld/i.test(faq.question)
).slice(0, 6);

/**
 * Citeable AEO block — server-rendered on the landing page so answer engines
 * see a clear entity definition + FAQ answers in HTML (not only JSON-LD).
 */
export function LandingAeoSection() {
  return (
    <section
      className="px-4 sm:px-6 pb-16 max-w-3xl mx-auto"
      aria-labelledby="what-is-shelf-heading"
    >
      <h2
        id="what-is-shelf-heading"
        className="text-xl sm:text-2xl font-semibold mb-3 tracking-tight"
      >
        What is {BRAND_NAME} ({BRAND_DOMAIN})?
      </h2>
      <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed mb-4">
        {BRAND_NAME} (also searched as myshelflib / My Shelf Lib) is a personal
        study library and AI study workspace. Upload your own PDFs and notes,
        highlight as you read, ask Study AI grounded in your material, practice
        with exam-style quizzes, write research Docs, and plan revision — in one
        private account. It is not a public content catalog.
      </p>
      <p className="text-sm text-[var(--text-muted)] leading-relaxed mb-8">
        Guests can browse{" "}
        <Link href="/learn" className="text-[var(--accent)] hover:underline">
          free Learn curriculum
        </Link>{" "}
        and{" "}
        <Link href="/features" className="text-[var(--accent)] hover:underline">
          feature guides
        </Link>{" "}
        without signing in. Your private library starts at{" "}
        <Link href="/login" className="text-[var(--accent)] hover:underline">
          sign-in
        </Link>
        .
      </p>

      <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-4">
        Common questions
      </h3>
      <dl className="space-y-4">
        {VISIBLE_FAQS.map((faq) => (
          <div key={faq.question}>
            <dt className="font-medium text-sm text-[var(--text-primary)] mb-1">
              {faq.question}
            </dt>
            <dd className="text-sm text-[var(--text-secondary)] leading-relaxed">
              {faq.answer}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
