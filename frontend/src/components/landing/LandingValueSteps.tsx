import Link from "next/link";
import { RevealOnScroll } from "@/components/RevealOnScroll";
import {
  CalendarDays,
  FileText,
  FolderOpen,
  ListChecks,
  Sparkles,
} from "lucide-react";

const STEPS = [
  {
    no: "1",
    icon: FileText,
    title: "Collect",
    body: "Bring together PDFs, notes, links and coaching material that usually stay scattered across different apps.",
    mini: "One place for all your material",
  },
  {
    no: "2",
    icon: FolderOpen,
    title: "Organize",
    body: "Build collections and topics, add sketch notebooks and doc pages beside PDFs, and place pages at library or collection level.",
    mini: "PDFs, notebooks, and docs together",
  },
  {
    no: "3",
    icon: Sparkles,
    title: "Ask AI",
    body: "Use Study AI on a single file, a topic, or your wider library so answers stay grounded in what you uploaded.",
    mini: "Context-aware AI, not generic chat",
  },
  {
    no: "4",
    icon: ListChecks,
    title: "Quiz",
    body: "Sit timed MCQs, written answers, and photo working from your library, uploads, or exam-bank material — a real quiz workspace, not chat bubbles.",
    mini: "Exam-style papers from your notes",
    href: "/quiz",
  },
  {
    no: "5",
    icon: CalendarDays,
    title: "Plan & goals",
    body: "Schedule revision on the planner with tasks linked back to pages. Optionally set a study goal so Study AI and planning stay aligned.",
    mini: "Planner, streaks, optional goal",
    href: "/features/planner-calendar",
  },
] as const;

export function LandingValueSteps() {
  return (
    <section className="landing-value-section" aria-labelledby="landing-how-heading">
      <RevealOnScroll>
        <div className="landing-value-head">
          <div>
            <div className="landing-kicker">How it works</div>
            <h2 id="landing-how-heading" className="landing-value-title">
              The product story, in five clear steps
            </h2>
          </div>
          <p className="landing-value-copy">
            Collect material, organize it, ask Study AI, sit exam-style quizzes,
            and plan revision on one calendar — the loop serious students repeat
            every week.
          </p>
        </div>
      </RevealOnScroll>
      <div className="landing-value-grid landing-value-grid-steps">
        {STEPS.map((step, index) => (
          <RevealOnScroll key={step.title} delay={index * 60}>
            <article className="landing-value-card">
              <div className="landing-value-no">{step.no}</div>
              <div className="landing-value-icon" aria-hidden>
                <step.icon />
              </div>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
              {"href" in step && step.href ? (
                <Link href={step.href} className="landing-value-mini hover:underline">
                  {step.mini} →
                </Link>
              ) : (
                <div className="landing-value-mini">{step.mini}</div>
              )}
            </article>
          </RevealOnScroll>
        ))}
      </div>
    </section>
  );
}
