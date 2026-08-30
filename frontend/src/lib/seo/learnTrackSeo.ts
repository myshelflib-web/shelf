import { STUDY_GOAL_LABELS } from "@/lib/studyGoal";
import { StudyGoal } from "@/types";

/** URL slugs for indexable /learn/tracks/* landing pages. */
export const LEARN_TRACK_SLUGS: Record<
  Exclude<StudyGoal, "GENERAL">,
  string
> = {
  UPSC: "upsc",
  STATE_PCS: "state-pcs",
  JUDICIARY: "judiciary",
  CA: "ca",
  NEET_PG: "neet-pg",
  GATE: "gate",
};

export const INDEXABLE_LEARN_TRACKS = Object.keys(
  LEARN_TRACK_SLUGS
) as Exclude<StudyGoal, "GENERAL">[];

const SLUG_TO_GOAL = Object.fromEntries(
  Object.entries(LEARN_TRACK_SLUGS).map(([goal, slug]) => [slug, goal])
) as Record<string, Exclude<StudyGoal, "GENERAL">>;

export function trackSlugForGoal(goal: StudyGoal): string | null {
  if (goal === "GENERAL") return null;
  return LEARN_TRACK_SLUGS[goal];
}

export function goalFromTrackSlug(
  slug: string
): Exclude<StudyGoal, "GENERAL"> | null {
  return SLUG_TO_GOAL[slug] ?? null;
}

export type TrackFaq = { question: string; answer: string };

type TrackSeo = {
  title: string;
  description: string;
  h1: string;
  /** Short label for /learn hub chips. */
  hubLabel: string;
  intro: string;
  keywords: string[];
  faqs: TrackFaq[];
};

/**
 * Titles lead with high-intent queries (syllabus, PYQ, bare acts).
 * Descriptions stay ≤160 chars for SERP snippets.
 */
export const LEARN_TRACK_SEO: Record<
  Exclude<StudyGoal, "GENERAL">,
  TrackSeo
> = {
  GATE: {
    title: "GATE Syllabus & Free Study Material — PYQs & Textbooks | Shelf",
    description:
      "GATE syllabus study pack on Shelf Learn — free previous-year papers, open textbooks, and topic PDFs. Browse GATE CS, ME, EE & more without signing in.",
    h1: "GATE syllabus & free study material",
    hubLabel: "GATE syllabus",
    intro:
      "Looking for GATE syllabus coverage and free study PDFs? Shelf Learn hosts official previous-year papers plus open textbooks, organized by subject and topic. Open any article in the reader — no account required.",
    keywords: [
      "GATE syllabus",
      "GATE previous year papers",
      "GATE study material free",
      "GATE PYQ PDF",
      "GATE exam preparation",
      "GATE CS syllabus",
      "free GATE notes",
      "engineering PG entrance",
    ],
    faqs: [
      {
        question: "Where can I find free GATE syllabus study material?",
        answer:
          "Shelf Learn at /learn/tracks/gate collects free GATE previous-year papers and open textbooks. Browse by subject without signing in; sign in to highlight and keep a private library.",
      },
      {
        question: "Does Shelf have GATE previous year question papers?",
        answer:
          "Yes. The Official GATE subject on Shelf Learn includes hundreds of official GATE PYQ PDFs, readable online in the Shelf reader.",
      },
      {
        question: "Is GATE material on Shelf free?",
        answer:
          "Yes. Public Learn curriculum is free to browse. Creating an account is optional and unlocks highlights, Study AI on your own uploads, and a private /my-content library.",
      },
    ],
  },
  UPSC: {
    title: "UPSC Syllabus & Free Study Material — CSE Papers & Guides | Shelf",
    description:
      "UPSC CSE syllabus resources on Shelf Learn — free Prelims/Mains papers, Budget, Economic Survey, Constitution, and Yojana PDFs. Browse without sign-in.",
    h1: "UPSC syllabus & free CSE study material",
    hubLabel: "UPSC syllabus",
    intro:
      "Free UPSC Civil Services curriculum from open-government sources — CSE papers, Budget and Economic Survey, Constitution, Yojana, and topic guides in one catalog.",
    keywords: [
      "UPSC syllabus",
      "UPSC study material free",
      "UPSC CSE syllabus PDF",
      "UPSC previous year papers",
      "free UPSC notes",
      "UPSC Prelims material",
      "Economic Survey UPSC",
      "civil services exam preparation",
    ],
    faqs: [
      {
        question: "Where can I get free UPSC syllabus PDFs?",
        answer:
          "Shelf Learn’s UPSC track hosts free CSE papers, Budget, Economic Survey, Constitution, and related open-government PDFs at /learn/tracks/upsc.",
      },
      {
        question: "Are UPSC previous year papers available on Shelf?",
        answer:
          "Yes. Prelims and Mains papers from open official sources are published as Learn articles you can open in the reader without an account.",
      },
      {
        question: "How is Learn different from my private Shelf library?",
        answer:
          "Learn is the public curriculum catalog. Your coaching notes and marked PDFs stay private on /my-content after you sign in.",
      },
    ],
  },
  STATE_PCS: {
    title: "State PCS Syllabus & Free Papers — TNPSC, RPSC | Shelf Learn",
    description:
      "State PCS syllabus packs on Shelf Learn — free TNPSC papers, RPSC samples, and state exam PDFs. Browse Tamil Nadu and Rajasthan material without sign-in.",
    h1: "State PCS syllabus & free exam papers",
    hubLabel: "State PCS",
    intro:
      "State public service commission papers from official sources — Tamil Nadu TNPSC collections and a curated Rajasthan RPSC sample set, with more states added over time.",
    keywords: [
      "State PCS syllabus",
      "TNPSC previous papers free",
      "TNPSC syllabus",
      "RPSC question papers",
      "state civil services exam",
      "free PCS PDF",
      "state PSC study material",
    ],
    faqs: [
      {
        question: "Does Shelf have TNPSC previous year papers?",
        answer:
          "Yes. The Tamil Nadu official subject on Shelf Learn includes free TNPSC papers and notices you can read online.",
      },
      {
        question: "Is there RPSC material on Shelf?",
        answer:
          "Yes. A curated Rajasthan official sample set is published under the State PCS track. More state packs are added as official sources allow.",
      },
    ],
  },
  JUDICIARY: {
    title: "Judiciary Exam Syllabus — Free Bare Acts & Law PDFs | Shelf",
    description:
      "Judiciary exam syllabus material on Shelf Learn — free IPC, CrPC, CPC, Companies Act, and Law Commission reports. Read bare acts online without sign-in.",
    h1: "Judiciary syllabus — free bare acts & reports",
    hubLabel: "Judiciary bare acts",
    intro:
      "Bare acts and Law Commission reference PDFs for judicial services and law entrance — criminal and civil codes in a structured topic tree.",
    keywords: [
      "judiciary exam syllabus",
      "bare acts PDF free",
      "IPC CrPC CPC PDF",
      "judicial services preparation",
      "law entrance bare acts",
      "Law Commission reports",
      "judiciary study material free",
    ],
    faqs: [
      {
        question: "Where can I read free bare acts for judiciary exams?",
        answer:
          "Shelf Learn’s Judiciary track publishes free IPC, CrPC, CPC, Companies Act, and related Law Commission reports as PDF articles.",
      },
      {
        question: "Can law students annotate bare acts on Shelf?",
        answer:
          "Sign in to highlight and keep notes in your private library. Public Learn PDFs are readable without an account.",
      },
    ],
  },
  CA: {
    title: "CA Syllabus & Free Study Material — Accounting & Statutes | Shelf",
    description:
      "CA Inter and Final syllabus resources on Shelf Learn — free open accounting textbooks and Companies Act PDFs. Browse without signing up.",
    h1: "CA syllabus & free study material",
    hubLabel: "CA syllabus",
    intro:
      "Open textbooks and government statutes for chartered accountancy — accounting fundamentals and company law references you can pair with your private notes.",
    keywords: [
      "CA syllabus",
      "CA study material free",
      "CA Inter notes PDF",
      "CA Final preparation",
      "accounting textbook PDF",
      "Companies Act CA",
      "chartered accountant exam",
    ],
    faqs: [
      {
        question: "Is there free CA study material on Shelf?",
        answer:
          "Yes. The CA track includes open accounting textbooks and Companies Act reference PDFs on Shelf Learn, free to browse.",
      },
    ],
  },
  NEET_PG: {
    title: "NEET PG Syllabus & Free Material — NMC Curriculum | Shelf",
    description:
      "NEET PG and INI-CET syllabus resources on Shelf Learn — free NMC CBME docs, exam notices, and open medical textbooks. Read online without sign-in.",
    h1: "NEET PG syllabus & free study material",
    hubLabel: "NEET PG syllabus",
    intro:
      "NMC curriculum references, exam notices, and open medicine textbooks for postgraduate medical entrance — browse the catalog without an account.",
    keywords: [
      "NEET PG syllabus",
      "NEET PG study material free",
      "INI-CET preparation",
      "NMC curriculum PDF",
      "medical PG entrance notes",
      "CBME curriculum",
      "open medical textbook",
    ],
    faqs: [
      {
        question: "Where can I find free NEET PG syllabus documents?",
        answer:
          "Shelf Learn’s NEET PG track hosts NMC curriculum references, exam notices, and selected open medical textbooks at /learn/tracks/neet-pg.",
      },
    ],
  },
};

export function learnTrackPath(goal: Exclude<StudyGoal, "GENERAL">): string {
  return `/learn/tracks/${LEARN_TRACK_SLUGS[goal]}`;
}

/** Merge track-specific terms into subject / topic / article keyword lists. */
export function learnPageKeywords(
  goal: StudyGoal | undefined | null,
  ...parts: string[]
): string[] {
  const base = parts.filter(Boolean);
  if (goal && goal !== "GENERAL" && LEARN_TRACK_SEO[goal]) {
    return [
      ...base,
      ...LEARN_TRACK_SEO[goal].keywords.slice(0, 5),
      "Shelf Learn",
    ];
  }
  return [
    ...base,
    "free study material",
    "exam syllabus",
    "Shelf Learn",
    "open educational resources",
  ];
}

export function learnArticleDescription(
  articleTitle: string,
  topicTitle: string,
  subjectName: string,
  goal?: StudyGoal | null
): string {
  const track =
    goal && goal !== "GENERAL"
      ? STUDY_GOAL_LABELS[goal]
      : "competitive exam";
  const base = `Read ${articleTitle} — ${topicTitle} in ${subjectName}. Free ${track} PDF on Shelf Learn.`;
  return base.slice(0, 160);
}

export function learnSubjectDescription(
  subjectName: string,
  goal?: StudyGoal | null,
  custom?: string | null
): string {
  if (custom?.trim()) return custom.trim().slice(0, 160);
  const track =
    goal && goal !== "GENERAL" ? STUDY_GOAL_LABELS[goal] : "exam";
  return `Free ${subjectName} study material for ${track} on Shelf Learn — syllabus articles, official PDFs, and topic guides. Browse without sign-in.`.slice(
    0,
    160
  );
}

export function learnTopicDescription(
  topicTitle: string,
  subjectName: string,
  goal?: StudyGoal | null,
  custom?: string | null
): string {
  if (custom?.trim()) return custom.trim().slice(0, 160);
  return `${topicTitle} — free ${subjectName} study topics on Shelf Learn. Read articles and PDFs for ${goal && goal !== "GENERAL" ? STUDY_GOAL_LABELS[goal] : "your exam"} without signing in.`.slice(
    0,
    160
  );
}
