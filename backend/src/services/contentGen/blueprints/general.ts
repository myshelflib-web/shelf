import type { StarterSubject } from "../types.js";

export const GENERAL_LEARNING: StarterSubject = {
  slug: "study-skills-learning",
  name: "Learning Science",
  description:
    "Evidence-based study techniques translated into routines you can run this week.",
  topics: [
    {
      slug: "retention",
      title: "Retention & Recall",
      articles: [
        {
          slug: "active-recall-and-spaced-repetition",
          title: "Active Recall and Spaced Repetition: The Two Highest-Yield Habits",
          syllabusAnchor:
            "Study skills — evidence-based learning techniques for long-term retention.",
          mustCover: [
            "The testing effect: why retrieving beats rereading, and why rereading feels more effective",
            "Fluency illusion and how it misleads self-assessment",
            "The forgetting curve and what spacing does to it",
            "Designing expanding review intervals, and what to do with a card you fail",
            "What separates a good retrieval question from a bad one",
            "Interleaving and desirable difficulty, and why they feel worse while working better",
            "A concrete weekly routine combining first pass, retrieval and spaced review",
          ],
          worked: [
            "Convert one dense textbook page into six retrieval questions, showing what was cut and why",
          ],
          traps: [
            "Making cards that can be answered by recognising the shape of the answer rather than recalling it",
            "Abandoning a schedule after a backlog builds, instead of triaging the backlog",
          ],
          officialSources: [],
          diagram: "timeline",
          keywords: [
            "active recall technique",
            "spaced repetition schedule",
            "testing effect studying",
            "how to study effectively",
          ],
          order: 0,
        },
        {
          slug: "note-making-systems",
          title: "Note-Making That Survives Revision: Cornell, Mapping and Summary Sheets",
          syllabusAnchor:
            "Study skills — note-making, summarisation and revision material design.",
          mustCover: [
            "Why verbatim transcription produces notes nobody revises",
            "The Cornell method: the cue column, the note column, the summary, and how each is used",
            "Concept mapping for topics whose value is in the links rather than the facts",
            "One-page summary sheets and what earns a place on them",
            "Highlighting and PDF annotation discipline: marking for retrieval, not for coverage",
            "Progressive condensation: rewriting notes shorter at each revision pass",
            "Matching the note format to the material type",
          ],
          worked: [
            "Take one topic and show it as Cornell notes and as a concept map, then say which fits it better and why",
          ],
          traps: [
            "Highlighting so much that nothing stands out",
            "Keeping the first-pass notes as the final revision material",
          ],
          officialSources: [],
          diagram: "compare",
          keywords: [
            "Cornell note taking method",
            "note making for exams",
            "revision notes technique",
            "concept mapping study",
          ],
          order: 1,
        },
      ],
    },
  ],
};

export const GENERAL_EXAM_CRAFT: StarterSubject = {
  slug: "study-skills-exam-craft",
  name: "Exam Craft",
  description:
    "Turning preparation into marks: attempt strategy, error analysis and sustainable planning.",
  topics: [
    {
      slug: "performance",
      title: "Performance & Analysis",
      articles: [
        {
          slug: "mock-test-analysis",
          title: "Mock Test Analysis: Turning Wrong Answers Into Marks",
          syllabusAnchor:
            "Study skills — test-taking strategy, error analysis and performance improvement.",
          mustCover: [
            "The three error classes: knowledge gap, application failure, and careless slip",
            "Why each class needs a different fix, and why treating all three as 'revise more' fails",
            "Building an error log that you actually revisit",
            "Attempt strategy arithmetic: expected value under negative marking",
            "Question triage and when to abandon a question",
            "Simulating real conditions: timing, environment and no pauses",
            "When to increase mock frequency and when more mocks stop helping",
          ],
          worked: [
            "Work through the expected-value calculation for a guess with two options eliminated under a given negative marking scheme, and state the decision rule that follows",
          ],
          traps: [
            "Reviewing only the questions you got wrong, ignoring the ones you guessed right",
            "Taking mocks frequently while analysing none of them",
          ],
          officialSources: [],
          diagram: "flow",
          keywords: [
            "mock test analysis method",
            "error log exam preparation",
            "negative marking attempt strategy",
          ],
          order: 0,
        },
        {
          slug: "study-planning-and-burnout",
          title: "Planning a Long Preparation Without Burning Out",
          syllabusAnchor:
            "Study skills — planning, consistency, sleep and stress management across long preparation cycles.",
          mustCover: [
            "Backward planning from the exam date, with revision blocked before content",
            "The weekly review as the control loop that corrects a drifting plan",
            "Deep work blocks, and what actually removes distraction rather than resisting it",
            "Sleep and its measured role in consolidation — why cutting it costs more than it buys",
            "Physical activity and its effect on sustained attention",
            "Early signs of burnout, and the difference between fatigue and burnout",
            "Setting a sustainable daily hour target and protecting one rest block",
          ],
          worked: [
            "Build a backward plan from a fixed exam date, showing where the revision passes are placed and what gets cut when the plan slips",
          ],
          traps: [
            "Planning peak-capacity days and treating any shortfall as failure",
            "Trading sleep for study hours during the final month",
          ],
          officialSources: [],
          diagram: "flow",
          keywords: [
            "study plan competitive exams",
            "avoid burnout exam preparation",
            "weekly review study method",
          ],
          order: 1,
        },
      ],
    },
  ],
};
