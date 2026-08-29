import Link from "next/link";
import { RevealOnScroll } from "@/components/RevealOnScroll";

const GUEST_ITEMS = [
  {
    title: "Learn curriculum",
    body: "Browse free syllabus articles and PDF packs on /learn without signing in.",
    href: "/learn",
  },
  {
    title: "Quiz explainer",
    body: "Read how exam-style MCQs, written answers, and photo working work on the public Quiz page.",
    href: "/quiz",
  },
  {
    title: "Feature guides",
    body: "Every capability — Telegram import, Spotify, sharing, Study AI, planner — has an indexable guide.",
    href: "/features",
  },
  {
    title: "Blog & workflows",
    body: "Long-form guides for libraries, readers, AI depth modes, keyboard shortcuts, and daily study loops.",
    href: "/blog",
  },
] as const;

export function LandingGuestAccessSection() {
  return (
    <section
      className="landing-value-section"
      id="guest-access"
      aria-labelledby="landing-guest-heading"
    >
      <RevealOnScroll>
        <div className="landing-value-head">
          <div>
            <div className="landing-kicker">Explore before sign-in</div>
            <h2 id="landing-guest-heading" className="landing-value-title">
              Open content and guides without an account
            </h2>
          </div>
          <p className="landing-value-copy">
            Shelf is a signed-in product for your private library — but several
            surfaces are public and crawlable so you can evaluate the workflow,
            read curriculum, and understand integrations before creating a Shelf.
          </p>
        </div>
      </RevealOnScroll>
      <ul className="landing-link-list">
        {GUEST_ITEMS.map((item, index) => (
          <RevealOnScroll key={item.title} delay={index * 40}>
            <li>
              <Link href={item.href} className="landing-link-row">
                <span className="landing-link-row-title">{item.title}</span>
                <span className="landing-link-row-body">{item.body}</span>
                <span className="landing-link-row-arrow" aria-hidden>
                  →
                </span>
              </Link>
            </li>
          </RevealOnScroll>
        ))}
      </ul>
    </section>
  );
}
