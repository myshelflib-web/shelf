import Link from "next/link";
import { Header } from "@/components/Header";
import { MarketingFooter } from "@/components/MarketingFooter";
import { RevealOnScroll } from "@/components/RevealOnScroll";
import { ArrowRight } from "lucide-react";

const PILLARS = [
  {
    title: "From your library",
    body: "Quiz a single PDF, a topic, a collection, or everything you have indexed. Stems stay on the excerpts Shelf retrieves — not a generic question bank.",
  },
  {
    title: "Upload plus syllabus",
    body: "Drop notes or a paper and optionally attach a syllabus. Each item can name the heading it maps to, the same relevancy docs Study AI already uses.",
  },
  {
    title: "Exam bank",
    body: "Drill PYQ-style, standard, and preloaded curriculum items for your study goal. Years are never invented; items are tagged Practice, Standard, or PYQ-style.",
  },
];

const ANSWERS = [
  {
    title: "MCQ",
    body: "Four options, real traps, instant mark after submit. Difficulty from easy revision through full exam standard.",
  },
  {
    title: "Written",
    body: "Typed answers with LaTeX for numericals and proofs. Scored against a marking scheme, not a chat dump of solutions.",
  },
  {
    title: "Photo of working",
    body: "Upload a photo of a derivation, diagram, or handwriting when that is the fair answer — same paper chrome as MCQs.",
  },
];

export function QuizMarketingLanding() {
  return (
    <div className="h-full overflow-y-auto flex flex-col">
      <Header />
      <main className="flex-1">
        <section className="relative px-4 sm:px-6 py-16 sm:py-24 max-w-3xl mx-auto text-center overflow-hidden">
          <div className="hero-glow" aria-hidden />
          <RevealOnScroll>
            <p className="text-sm font-medium text-[var(--accent)] mb-3 tracking-wide uppercase">
              Shelf Quiz
            </p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-5 tracking-tight leading-tight">
              Exam-style papers from{" "}
              <span className="text-[var(--accent)]">your own notes</span>
            </h1>
            <p className="text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed max-w-2xl mx-auto">
              Sit timed MCQs, written answers, and photos of working — scoped to a
              document, an upload plus syllabus, or a PYQ-style exam bank. Math and
              non-math use the same workspace.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/login?next=/quiz" className="btn-primary">
                Start a quiz
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/blog/exam-style-quiz-from-your-notes"
                className="btn-secondary"
              >
                How Quiz works
              </Link>
            </div>
          </RevealOnScroll>
        </section>

        <section className="px-4 sm:px-6 pb-16 max-w-3xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-semibold mb-6 text-center sm:text-left">
            Three ways to set the paper
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {PILLARS.map((item, i) => (
              <RevealOnScroll key={item.title} delay={i * 80}>
                <article className="feature-card p-5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] h-full">
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    {item.body}
                  </p>
                </article>
              </RevealOnScroll>
            ))}
          </div>
        </section>

        <section className="px-4 sm:px-6 pb-16 max-w-3xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-semibold mb-6 text-center sm:text-left">
            How you answer
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {ANSWERS.map((item, i) => (
              <RevealOnScroll key={item.title} delay={i * 80}>
                <article className="feature-card p-5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] h-full">
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    {item.body}
                  </p>
                </article>
              </RevealOnScroll>
            ))}
          </div>
        </section>

        <section className="px-4 sm:px-6 pb-20 max-w-3xl mx-auto text-center">
          <RevealOnScroll>
            <h2 className="text-2xl font-semibold mb-3">
              Same quiz from the library, reader, or Study AI
            </h2>
            <p className="text-[var(--text-secondary)] mb-6">
              Sign in to generate a paper from a collection or page, type /quiz in
              Study AI, or press g then q. Guest visitors can read how it works;
              attempts stay private to your account.
            </p>
            <Link href="/login?next=/quiz" className="btn-primary">
              Sign in to quiz
              <ArrowRight className="w-4 h-4" />
            </Link>
          </RevealOnScroll>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
