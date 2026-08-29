import Link from "next/link";
import { ArrowRight, BookOpen, FileText } from "lucide-react";
import { RevealOnScroll } from "@/components/RevealOnScroll";

export function LandingLearnSection() {
  return (
    <section
      className="landing-showcase-section"
      id="learn"
      aria-labelledby="landing-learn-heading"
    >
      <div className="landing-showcase-block grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        <RevealOnScroll>
          <p className="landing-kicker mb-2">Free curriculum</p>
          <h2 id="landing-learn-heading" className="!mb-3">
            Open PDFs and articles on Learn — no sign-in required
          </h2>
          <p className="!mb-4">
            Browse free curriculum packs: syllabus articles, textbooks, and topic
            guides on <strong>/learn</strong>. Read and explore without an
            account. Sign in when you want a parallel private library of your own
            uploads, highlights, Study AI, planner, and quiz workspace.
          </p>
          <ul className="space-y-2 text-sm text-[var(--text-muted)] mb-6">
            <li className="flex items-start gap-2">
              <BookOpen className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
              Public curriculum separate from your private /my-content tree
            </li>
            <li className="flex items-start gap-2">
              <FileText className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
              Indexed for search; open any article or PDF pack immediately
            </li>
          </ul>
          <div className="flex flex-wrap gap-3">
            <Link href="/learn" className="landing-btn landing-btn-primary">
              Browse free library
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/features/free-curriculum" className="landing-btn">
              Learn feature guide
            </Link>
          </div>
        </RevealOnScroll>
        <RevealOnScroll delay={80}>
          <div className="landing-goal-card !mt-0">
            <div className="landing-goal-card-head">
              <span>Learn · Public curriculum</span>
              <span>No account needed</span>
            </div>
            <div className="landing-goal-body text-sm">
              <div className="landing-cta-grid">
                <div className="landing-cta-card">
                  <strong>Read articles</strong>
                  <span>Syllabus guides & topic explainers</span>
                </div>
                <div className="landing-cta-card">
                  <strong>Open PDF packs</strong>
                  <span>Where curriculum includes files</span>
                </div>
              </div>
            </div>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
