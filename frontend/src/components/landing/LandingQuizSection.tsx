import Link from "next/link";
import { ArrowRight, ListChecks } from "lucide-react";
import { RevealOnScroll } from "@/components/RevealOnScroll";
import { LandingWindow } from "./LandingWindow";
import { LandingKicker } from "@/components/landing/LandingKicker";

const PILLARS = [
  {
    title: "From your library",
    body: "Quiz a single PDF, a topic, a collection, or everything you have indexed. Stems stay on excerpts Shelf retrieves — not a generic question bank.",
  },
  {
    title: "Upload plus syllabus",
    body: "Drop notes or a paper and optionally attach a syllabus. Each item can map to the headings Study AI already uses for relevancy.",
  },
  {
    title: "Exam bank",
    body: "Drill PYQ-style, standard, and preloaded curriculum items. Years are never invented; items are tagged Practice, Standard, or PYQ-style when needed.",
  },
] as const;

const ANSWERS = [
  { title: "MCQ", body: "Four options, real traps, instant mark after submit." },
  { title: "Written", body: "Typed answers with LaTeX — scored against a marking scheme." },
  { title: "Photo working", body: "Upload handwriting or diagrams when that is the fair answer." },
] as const;

function QuizMockup() {
  return (
    <LandingWindow title="Shelf — Quiz">
      <div className="p-4 space-y-3 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-medium">Practice paper</span>
          <span className="text-[var(--text-muted)]">12:40 left</span>
        </div>
        <div className="p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)]">
          <p className="font-medium mb-2">Q3 · MCQ</p>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            Which doctrine limits Parliament&apos;s power to amend beyond the
            Constitution&apos;s essential character?
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {["Basic Structure", "Harmonious construction", "Pith and substance", "Colourable legislation"].map(
            (opt, i) => (
              <div
                key={opt}
                className={`p-2 rounded-lg border text-[10px] ${
                  i === 0
                    ? "border-[var(--accent)] bg-[var(--accent-subtle)] text-[var(--accent)]"
                    : "border-[var(--border)]"
                }`}
              >
                {opt}
              </div>
            )
          )}
        </div>
      </div>
    </LandingWindow>
  );
}

export function LandingQuizSection() {
  return (
    <section className="landing-showcase-section" id="quiz" aria-labelledby="landing-quiz-heading">
      <div className="landing-showcase-block grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
        <RevealOnScroll>
          <LandingKicker index="03" className="mb-2">
            Exam-style quiz
          </LandingKicker>
          <h2 id="landing-quiz-heading" className="!mb-3">
            Sit real papers from your own notes
          </h2>
          <p className="!mb-4">
            Timed MCQs, written answers, and photos of working — scoped to a
            document, an upload with syllabus, or a PYQ-style exam bank. Sit a
            proctored fullscreen paper or a practice quiz, then open the
            analysis board. Sign in to generate papers from your library.
          </p>
          <div className="flex flex-wrap gap-3 mb-6">
            <Link href="/quiz" className="landing-btn landing-btn-primary">
              Explore Quiz
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/features/exam-quiz" className="landing-btn">
              Quiz feature guide
            </Link>
          </div>
          <h3 className="text-sm font-semibold mb-3">Three ways to set the paper</h3>
          <div className="space-y-3">
            {PILLARS.map((item) => (
              <div
                key={item.title}
                className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]"
              >
                <p className="text-sm font-semibold mb-1">{item.title}</p>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </RevealOnScroll>
        <RevealOnScroll delay={80}>
          <div className="space-y-4">
            <QuizMockup />
            <div className="grid sm:grid-cols-3 gap-3">
              {ANSWERS.map((item) => (
                <div
                  key={item.title}
                  className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]"
                >
                  <ListChecks className="w-4 h-4 text-[var(--accent)] mb-2" />
                  <p className="text-xs font-semibold mb-1">{item.title}</p>
                  <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
