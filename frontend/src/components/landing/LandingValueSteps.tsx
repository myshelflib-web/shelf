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
    icon: FileText,
    title: "Collect",
    body: "Bring together PDFs, YouTube lectures, notes, links and coaching material that usually stay scattered — including Telegram forwards you can send back from Share.",
    mini: "One place for all your material",
  },
  {
    icon: FolderOpen,
    title: "Organize",
    body: "Build collections and topics, add YouTube playlists, sketch notebooks and doc pages beside PDFs, and place pages at library or collection level.",
    mini: "PDFs, notebooks, and docs together",
  },
  {
    icon: Sparkles,
    title: "Ask AI",
    body: "Use Study AI on a single file, a topic, or your wider library so answers stay grounded in what you uploaded.",
    mini: "Context-aware AI, not generic chat",
  },
  {
    icon: ListChecks,
    title: "Quiz",
    body: "Sit timed MCQs, written answers, and photo working from your library, uploads, or exam-bank material — a real quiz workspace, not chat bubbles.",
    mini: "Exam-style papers from your notes",
    href: "/quiz",
  },
  {
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
              Five steps from scattered files to a study loop
            </h2>
          </div>
          <p className="landing-value-copy">
            Collect material, organize it, ask Study AI, sit exam-style quizzes, and
            plan revision on one calendar.
          </p>
        </div>
      </RevealOnScroll>
      <div className="landing-value-grid landing-value-grid-steps">
        {STEPS.map((step, index) => (
          <RevealOnScroll key={step.title} delay={index * 60}>
            <article className="landing-value-card">
              <div className="landing-value-card-head">
                <step.icon aria-hidden />
                <h3>{step.title}</h3>
              </div>
              <p>{step.body}</p>
              {"href" in step && step.href ? (
                <Link href={step.href} className="landing-value-link">
                  {step.mini} →
                </Link>
              ) : (
                <p className="landing-value-link landing-value-link-muted">{step.mini}</p>
              )}
            </article>
          </RevealOnScroll>
        ))}
      </div>
    </section>
  );
}
