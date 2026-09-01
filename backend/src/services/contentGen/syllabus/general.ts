import { L, topic, type SyllabusSubject } from "./syllabusTypes.js";

const LEARN = "Study skills: encoding, storage and retrieval — testing, spacing, interleaving, notes and dual coding.";
const CRAFT = "Exam craft: error classes, negative-marking expected value, mock cadence, sleep, burnout and backward planning.";

export const GENERAL_CORPUS: SyllabusSubject[] = [
  {
    slug: "study-skills-learning",
    name: "Learning Science and Study Skills",
    description:
      "How material stays available under exam conditions: retrieval, spacing, notes, and encoding that survives a blank page.",
    paper: "Study skills",
    sources: [],
    topics: [
      topic("encoding-and-retrieval", "Encoding, Retrieval and Practice Design", LEARN, [
        L("testing-effect", "The Testing Effect: Retrieval Beats Restudy", [
          "A closed-book recall trial is practice of the exam act; rereading only practises recognition",
          "After a first pass, replace highlighting with a blank-page reconstruction of the same section",
          "Score the retrieval: what you could not produce is the only item that needs restudy",
          "Familiarity (‘I know this’) is not availability; the test is whether the answer appears without the book",
        ], "compare", ["testing effect study", "retrieval vs rereading"]),
        L("spaced-repetition", "Spacing Reviews Instead of Cramming", [
          "The same total minutes, split across days, outlast a single massed block for delayed tests",
          "Expand intervals after a successful recall; shrink them after a miss — schedule follows performance",
          "A 2–3–7–14 day ladder is a starting grid, not a law; move a card only when recall is clean",
          "Cramming can win a quiz tomorrow and lose the mock in three weeks; space for the later test",
        ], "timeline", ["spaced repetition", "expanding intervals"]),
        L("interleaving-practice", "Interleaving Topics versus Blocked Practice", [
          "Blocked practice (one topic for an hour) feels fluent and under-prepares discrimination",
          "Interleave confusable items: mix two ODE types, two tax heads, or two similar case tests in one set",
          "The extra difficulty of choosing the method is the learning; do not un-mix the set to feel faster",
          "Keep a block only for the first exposure; switch to mixed sets as soon as the procedure is known",
        ], "compare", ["interleaving practice", "blocked vs mixed practice"]),
        L("retrieval-questions", "Writing Retrieval Questions from Notes", [
          "Turn each heading into a question the book is not allowed to answer: ‘State…’, ‘Compare…’, ‘Compute…’",
          "One question per claim, not one question per chapter; a list of 8 is more usable than a paragraph prompt",
          "Cover the answer, speak or write it, then uncover — the delay before checking is the training",
          "Promote a question that fails twice into the next day’s mixed set; retire one that succeeds three times running",
        ], "cards", ["retrieval questions", "self testing prompts"]),
        L("desirable-difficulty", "Desirable Difficulty without Useless Struggle", [
          "A task is usefully hard when you can almost succeed with effort; impossible tasks teach avoidance",
          "If accuracy on a mixed set is near chance, drop back to a worked example, then re-mix sooner than it feels comfortable",
          "If accuracy is near ceiling and speed is high, the set is too easy: shorten review or raise mixing",
          "Effort that produces a checkable product (an answer, a diagram, a formula) beats effort that only rereads",
        ], "flow", ["desirable difficulty", "practice difficulty"]),
      ]),
      topic("notes-and-encoding", "Notes, Maps and Encoding Channels", LEARN, [
        L("cornell-notes", "Cornell Notes: Cue Column and Summary Strip", [
          "Page split: notes during exposure, cues written later as questions, summary in a few lines at the foot",
          "The cue column is a retrieval list, not a heading copy; cover the notes and answer from cues only",
          "Write the summary after a delay, from memory, then repair from the notes — not the other way around",
          "One Cornell sheet per concept, not per lecture hour; merge sheets that turned out to be the same idea",
        ], "hierarchy", ["Cornell notes", "cue column"]),
        L("concept-maps", "Concept Maps for Relationships, Not Decoration", [
          "Nodes are terms; labelled arrows are the claims (‘causes’, ‘is a type of’, ‘constrained by’)",
          "A map earns its space when two terms would otherwise be confused; a list of synonyms does not need a map",
          "Rebuild the map from memory on a blank page; missing arrows are the revision list",
          "Keep maps small (8–12 nodes); a wall-sized map is a poster, not a retrieval object",
        ], "flow", ["concept maps study", "labelled links"]),
        L("highlighting-discipline", "Highlighting as a Trap unless Strictly Limited", [
          "First pass: no highlighter. Mark only after you can state why the sentence is the load-bearing claim",
          "Cap: a handful of marks per page; if most of the paragraph is yellow, none of it will pop later",
          "Convert every highlight into a retrieval question the same day, or the mark is a sunk cost",
          "Colour-coding schemes decay; one colour for definitions and one for exceptions is enough",
        ], "cards", ["highlighting discipline", "annotation limits"]),
        L("dual-coding", "Dual Coding: Words plus a Spatial Structure", [
          "Pair a verbal claim with a diagram, timeline, table or number line — two codes, one idea",
          "Redraw the figure from the caption only; if you cannot, the figure was decoration",
          "Tables beat prose for confusable pairs (MCQ vs MSQ, σ vs τ, GDP vs GVA)",
          "Do not dual-code everything: a single definition with no structure is cheaper as a flashcard",
        ], "compare", ["dual coding learning", "words and diagrams"]),
        L("feynman-technique", "Explain-It-Simply as a Gap Detector", [
          "Explain the idea aloud or on paper as if to a sharp beginner, without looking at notes",
          "Every hedge, skipped step or borrowed jargon marks a hole; that hole is the next study block",
          "Re-read only the hole, then explain again; a fluent second pass that still skips the same step has not closed it",
          "Time-box to ten minutes; an endless lecture is performance, not diagnosis",
        ], "flow", ["Feynman technique", "explain simply"]),
        L("elaborative-interrogation", "Elaborative Interrogation: Asking Why and When", [
          "After a fact, ask ‘why would this be true?’ and ‘when would it fail?’ — answers must be specific",
          "Link the new claim to a prior one you already retrieve (not to a vague ‘because science’)",
          "Write one because-clause per formula: ‘because energy is conserved along the streamline when…’",
          "Stop at one or two links; a chain of seven whys is philosophy hour, not encoding",
        ], "cards", ["elaborative interrogation", "why questions study"]),
        L("flashcard-hygiene", "Flashcards: One Prompt, One Answer, Aggressive Pruning", [
          "Front is a question or a cue, never a paragraph; back is the shortest correct answer plus one trap",
          "Split a card that has three facts; merge cards that are the same fact in two wordings",
          "Delete cards you have not missed in a month; a fat deck is unread literature",
          "Image occlusion and cloze beat copied sentences; the gap must be the thing the exam will ask",
        ], "hierarchy", ["flashcard hygiene", "cloze cards"]),
      ]),
    ],
  },
  {
    slug: "study-skills-exam-craft",
    name: "Exam Craft and Preparation Management",
    description:
      "Turning study into marks: error logs, negative-marking arithmetic, mocks, sleep, burnout and plans that start from the date.",
    paper: "Exam craft",
    sources: [],
    topics: [
      topic("attempt-and-feedback", "Attempt Strategy and Feedback Loops", CRAFT, [
        L("error-classes", "Classifying Errors so the Next Week Changes", [
          "Five buckets: concept missing, method chosen wrong, arithmetic, misread stem, time/rush — not ‘careless’ as a dump",
          "A guessed-correct is not a pass; log it with the method you should have used",
          "Unattempted items get a bucket too: unknown, known-but-slow, or abandoned — each has a different fix",
          "A class that repeats three mocks is a syllabus item, not a personality trait; schedule it as a topic",
        ], "cards", ["error classification mocks", "concept vs calculation error"]),
        L("expected-value-negative-marking", "Expected Value under Negative Marking", [
          "EV = p(+marks) + (1−p)(−penalty); attempt when EV > 0 after your real p, not after hope",
          "One-of-four with −1/3: eliminating one option can flip EV positive; a blind tick often does not",
          "Multi-correct / ‘all that apply’ with no partial credit: extra ticks can zero the item — never complete a set by vibe",
          "Numerical items with no penalty: an order-of-magnitude estimate is worth entering; a unit-mismatch guess is not",
        ], "flow", ["negative marking expected value", "educated guess"]),
        L("two-pass-attempt", "Two-Pass Attempt: Sweep then Invest", [
          "Pass one: take every item you can finish in a strict time cap; mark the rest without shame",
          "Pass two: spend leftover minutes on marked items in descending expected-value order, not in booklet order",
          "Never let a single item steal the time that would buy three later marks — cap and move",
          "Leave a two-minute buffer for bubbling / NAT entry / flagged review; a unfinished sheet is a process error",
        ], "flow", ["two pass exam strategy", "time cap per question"]),
        L("error-log", "The Error Log as the Real Syllabus", [
          "One line per miss: stem gist, your answer, right answer, bucket, the one-sentence fix, date",
          "Review the log before the next mixed set; do not only restudy the chapter the miss came from",
          "Promote a repeated miss to a retrieval question and a calendar slot; demote a one-off",
          "If the log is empty after a mock, the review was not done — score without a log is a vanity metric",
        ], "hierarchy", ["exam error log", "mock review log"]),
        L("time-caps-per-question", "Time Caps and When to Abandon an Item", [
          "Budget marks-per-minute from the paper’s total; a 2-mark item does not get 2× a 1-mark item if it is a trap nest",
          "A hard cap (e.g. 90 s then mark) beats a feeling of ‘almost’; almost is how people miss ten later easy marks",
          "Abandon when the next step is a guess among unreduced options or an algebra swamp with no check",
          "Track in mocks whether abandoned items would have paid; if yes, the cap is too tight — adjust, do not romanticise grit",
        ], "cards", ["time cap exam", "when to skip a question"]),
      ]),
      topic("schedule-and-stamina", "Schedule, Sleep and Stamina", CRAFT, [
        L("mock-cadence", "Mock Cadence: Frequency, Full Length, Analysis Time", [
          "Early: one sectional or half-length to learn the interface; late: full-length under the real clock",
          "A mock without same-day analysis is entertainment; block as many hours for review as for sitting",
          "Space mocks so the error-log fixes can be practised before the next one; weekly then twice-weekly is a common ramp",
          "Score trend over five sittings beats one heroic percentile; ignore ranking until the process is stable",
        ], "timeline", ["mock test cadence", "full length mocks"]),
        L("sleep-consolidation", "Sleep as Consolidation, Not Leftover Time", [
          "Post-learning sleep supports retention; cutting sleep to add a reread often loses more than it buys",
          "Protect a regular window in the weeks before the paper; all-nighters dump working memory on the day",
          "A short nap can restore attention; it does not replace nocturnal consolidation of the day’s retrieval practice",
          "Caffeine is a timing tool, not a sleep substitute; last dose far enough from lights-out that sleep still happens",
        ], "compare", ["sleep consolidation learning", "all nighter exam"]),
        L("burnout-versus-fatigue", "Burnout versus Ordinary Fatigue", [
          "Fatigue: tired after load, recovers with sleep and one easier day; output returns",
          "Burnout: cynicism, dread of the desk, and falling output that rest days do not reset — load and meaning are both wrong",
          "Response to fatigue: sleep, shorten the next block, keep the plan. Response to burnout: cut volume, restore one non-study hour, and drop comparison",
          "A heroic 12-hour day that produces no retrieval products is a burnout risk, not a virtue",
        ], "compare", ["burnout vs fatigue study", "study stamina"]),
        L("backward-planning", "Backward Planning from the Exam Date", [
          "Write the date, then reserve the last stretch for mixed mocks and error-log only — not for new chapters",
          "Divide remaining calendar into syllabus units with finish dates; leftover days are buffer, not optional extras",
          "Weekly: three outcomes that would make the week a success; daily: one hard retrieval block before optional reread",
          "When you slip, cut scope (depth or low-yield units), not sleep and not the mock slot",
        ], "flow", ["backward planning exam", "syllabus countdown"]),
        L("exam-taper", "Taper in the Final Days", [
          "Volume down, retrieval up: short mixed sets and formula-sheet checks, not new books",
          "Keep wake time, meal time and commute identical to the paper day for at least several days",
          "Stop collecting resources; a new PDF in the last 72 hours is anxiety, not coverage",
          "The night before: pack, skim the error-log headlines, sleep — no full mock that you cannot analyse",
        ], "timeline", ["exam taper week", "final days revision"]),
      ]),
    ],
  },
];
