import type { ChatMessage } from "../../llmTypes.js";
import type { GeneratedArticle, ResolvedArticleSpec } from "../types.js";

const HOUSE_STYLE = [
  "Write in clear Indian English for a serious aspirant who has already decided to study this topic — they need substance, not persuasion.",
  "Teach, do not summarise. A sentence that only names a concept without explaining it is wasted. If you mention a doctrine, provision, mechanism or case, say what it actually does and why it matters here.",
  "Every factual claim must be one you can defend from the listed official sources or from standard reference material for this exam.",
  "Do not invent case names, section numbers, article numbers, years, committee names or statistics. If you are not certain of a specific figure, explain the concept without the figure — that is always the better answer.",
  "Avoid figures that change every year. Prefer the definition and the mechanism over the current value.",
  "Do not quote copyrighted text. Explain in your own words.",
  "No motivational padding, no first person, no 'in conclusion', no 'it is important to note', no rhetorical questions.",
].join(" ");

const BANNED = [
  "Ban these empty constructions outright: 'plays a vital role', 'is of utmost importance', 'multifaceted', 'in today's world', 'it is worth noting', 'various factors', 'a number of reasons', 'holistic approach', 'the need of the hour'.",
  "Never write a sentence whose only content is that a topic is important or frequently asked. Show the substance instead.",
].join(" ");

function diagramInstruction(spec: ResolvedArticleSpec): string {
  if (spec.diagram === "none") return '"diagram": null';
  const shapes: Record<string, string> = {
    flow: '{"kind":"flow","title":"...","caption":"one line on how to read it","steps":[{"label":"short step name","detail":"one specific line"}]}  // 4-6 steps in genuine causal order',
    timeline:
      '{"kind":"timeline","title":"...","caption":"one line","steps":[{"label":"year or phase","detail":"what specifically changed"}]}  // 5-7 entries, chronological',
    hierarchy:
      '{"kind":"hierarchy","title":"...","caption":"one line","steps":[{"label":"level or branch","detail":"what sits here"}]}  // 4-6 levels, broadest first',
    compare:
      '{"kind":"compare","title":"...","caption":"one line","leftHeading":"...","rightHeading":"...","rows":[{"left":"...","right":"..."}]}  // 4-6 genuinely contrasting rows',
    cycle:
      '{"kind":"cycle","title":"...","caption":"one line","steps":[{"label":"stage","detail":"what happens here"}]}  // 4-6 stages that loop',
    cards:
      '{"kind":"cards","title":"...","caption":"one line","steps":[{"label":"card title","detail":"one specific line"}]}  // 4 cards',
  };
  return `"diagram": ${shapes[spec.diagram]}`;
}

function specBrief(spec: ResolvedArticleSpec): string {
  const parts = [
    `SUBJECT: ${spec.subjectName}${spec.paper ? ` (${spec.paper})` : ""}`,
    `TOPIC: ${spec.topicTitle}`,
    `TITLE: ${spec.title}`,
    `SYLLABUS ANCHOR (the page exists to serve this line): ${spec.syllabusAnchor}`,
    "",
    "MUST COVER — every one of these has to be genuinely explained, with its mechanism or reasoning, not merely named:",
    spec.mustCover.map((m, i) => `${i + 1}. ${m}`).join("\n"),
  ];

  if (spec.worked?.length) {
    parts.push(
      "",
      "MUST WORK THROUGH — these are not optional; each needs its own section with the reasoning shown step by step:",
      spec.worked.map((w) => `- ${w}`).join("\n")
    );
  }

  if (spec.traps?.length) {
    parts.push(
      "",
      "MUST WARN ABOUT — put these in commonMistakes, phrased as the correction:",
      spec.traps.map((t) => `- ${t}`).join("\n")
    );
  }

  parts.push(
    "",
    `THIS PAGE is only "${spec.title}". Related skills that have their own pages belong in linkages (one line each), not as extra chapters here.`,
    "",
    "STAY CONSISTENT WITH THESE OFFICIAL SOURCES:",
    spec.officialSources.length
      ? spec.officialSources.join("\n")
      : "No specific portal — rely on standard reference material for this exam.",
    "",
    `SEO KEYWORDS to use naturally in the title, meta description and headings (never stuff them): ${spec.keywords.join(", ")}`
  );

  return parts.join("\n");
}

const SCHEMA = `{
  "title": "clear and specific, <= 70 characters, contains the primary keyword",
  "metaDescription": "140-158 characters describing what the reader will be able to do after reading, containing the primary keyword",
  "intro": "3-4 sentences that state what this topic is, why the exam tests it, and what the page will establish. No throat-clearing.",
  "sections": [
    {
      "heading": "a substantive topic heading that names the content, not 'Introduction' or 'Overview'",
      "paragraphs": ["...", "..."],
      "bullets": ["optional, only where a list genuinely beats prose"],
      "table": {
        "caption": "what the table lets the reader compare",
        "columns": ["...", "..."],
        "rows": [["...", "..."]]
      }
    }
  ],
  "keyTakeaways": ["6-8 one-line revision points, each carrying a specific fact or distinction"],
  "examPointers": ["4-6 lines on how this is actually asked — the angle, the format, what the examiner is testing"],
  "commonMistakes": ["4-6 errors candidates make, each phrased as the correction"],
  "linkages": ["3-4 other syllabus areas this connects to, each with one line on how"],
  "glance": {
    "title": "At a glance",
    "cards": [
      { "label": "short heading", "detail": "one specific teaching line, not a slogan" }
    ]
  },
  "keywords": ["6-10 search phrases"]
}`;

export function draftMessages(
  blueprint: { label: string; examContext: string },
  spec: ResolvedArticleSpec
): ChatMessage[] {
  return [
    {
      role: "system",
      content: `You are a senior faculty member who writes the study material that ${blueprint.label} candidates actually revise from. ${blueprint.examContext} ${HOUSE_STYLE} ${BANNED} You reply with a single JSON object and nothing else.`,
    },
    {
      role: "user",
      content: `Write a complete study page.

${specBrief(spec)}

Return exactly this JSON shape:
${SCHEMA},
  ${diagramInstruction(spec)}

Length and structure requirements — these are hard:
- 8 to 10 sections. 1800-2400 words total across all paragraphs.
- Each section needs 2 to 4 paragraphs of 60-110 words each. A one-line section is a failure.
- At least TWO sections must carry a "table" — use it where the content is genuinely comparative or enumerable (provisions against their effect, before and after an amendment, competing tests, classification with examples). Set "table" to null on every other section.
- Every table needs 2-4 columns and 3-6 rows, and every cell must carry real content, not a placeholder.
- Order the sections so the page builds: establish the concept, then the specifics, then the worked reasoning, then the analytical or critical angle.
- Cover the MUST COVER list in the body. The checklist is not a section plan — group items into sections that read naturally.
- Do not write a full treatment of a sibling skill that is not on this checklist. A one-line linkage is enough.
- glance.cards must have exactly 4 cards. Each card is a real distinction or mechanism from this page, not a motivational label.

Plain text only inside every string: no markdown, no HTML, no asterisks, no bracketed citations, no bold markers.`,
    },
  ];
}

function draftBody(draft: GeneratedArticle): string {
  return [
    draft.intro,
    ...draft.sections.map((s) => {
      const table = s.table
        ? `TABLE (${s.table.caption}): ${s.table.columns.join(" | ")}\n${s.table.rows
            .map((r) => r.join(" | "))
            .join("\n")}`
        : "";
      return [s.heading, ...s.paragraphs, ...(s.bullets ?? []), table]
        .filter(Boolean)
        .join("\n");
    }),
    draft.keyTakeaways.join("\n"),
    draft.examPointers.join("\n"),
    draft.commonMistakes.join("\n"),
  ].join("\n\n");
}

export function recheckMessages(
  blueprint: { label: string },
  spec: ResolvedArticleSpec,
  draft: GeneratedArticle
): ChatMessage[] {
  const worked = spec.worked?.length
    ? `\nMUST HAVE BEEN WORKED THROUGH:\n${spec.worked.map((w) => `- ${w}`).join("\n")}`
    : "";

  return [
    {
      role: "system",
      content: `You are a reviewer for ${blueprint.label} preparation material. You check whether THIS page teaches its own checklist. You do not demand that it also be the textbook for neighbouring pages. You reply with a single JSON object and nothing else.`,
    },
    {
      role: "user",
      content: `PAGE TITLE: ${spec.title}
TOPIC LINE (context only — not extra coverage items): ${spec.syllabusAnchor}

COVERAGE CHECKLIST — this is the only list that can go in "missing". Each item must be taught somewhere in the draft (mechanism or reasoning). A dedicated heading is not required.
${spec.mustCover.map((m, i) => `${i + 1}. ${m}`).join("\n")}${worked}

DRAFT:
${draftBody(draft).slice(0, 28000)}

Audit it and return:
{
  "score": 0-100,
  "missing": ["checklist items that are absent, or that are only name-dropped without being explained"],
  "corrections": ["specific factual errors: wrong section or article numbers, wrong years, wrong case names, misattributed doctrines, or claims too risky to publish. Quote the offending phrase."],
  "vague": ["passages that state that something matters without teaching it, or that restate the heading in different words. Quote the passage."],
  "verdict": "pass" or "revise"
}

Scoring:
- Start at 100. Subtract about 10 for each truly missing checklist item, about 6 for each real factual correction, about 3 for each vague quote. Floor at 0.
- If an item is explained in a section, table or worked example, it is covered even if the wording does not match the checklist.
- Do not put sibling skills (other pages) in "missing". Those belong on their own pages; a linkage line is enough.
- Do not fail a page for omitting a full treatment of testing, spacing, interleaving, dual coding, storage, or retrieval unless that item is on THIS checklist.
- Factual nits that do not mislead a candidate are corrections, not a reason to collapse the score below 70 if coverage is complete.

Score 90+ when every checklist item is explained and there are no serious factual errors. Use "revise" when score is below 85, or when corrections or vague is non-empty.`,
    },
  ];
}

export function reviseMessages(
  blueprint: { label: string; examContext: string },
  spec: ResolvedArticleSpec,
  draft: GeneratedArticle,
  review: { missing: string[]; corrections: string[]; vague: string[] }
): ChatMessage[] {
  const bullets = (items: string[]) =>
    items.length ? items.map((i) => `- ${i}`).join("\n") : "- none";

  return [
    {
      role: "system",
      content: `You are a senior faculty member revising exam material for ${blueprint.label}. ${blueprint.examContext} ${HOUSE_STYLE} ${BANNED} You reply with a single JSON object in the same shape you were given and nothing else.`,
    },
    {
      role: "user",
      content: `Here is the current draft as JSON:
${JSON.stringify(draft).slice(0, 28000)}

A reviewer found problems.

MISSING OR ONLY NAME-DROPPED — explain each properly, in the section where it belongs:
${bullets(review.missing)}

FACTUAL CORRECTIONS REQUIRED — apply every one:
${bullets(review.corrections)}

FILLER TO REPLACE — rewrite each of these passages so it teaches something specific, or cut it and use the space on the missing items:
${bullets(review.vague)}

Rules for the revision:
- Keep the identical JSON shape and keep the tables.
- Do not drop content that was already correct and substantive.
- Do not shorten the page. If you cut filler, spend the words on the missing items.
- Do not add full chapters on sibling skills that are not on this page's missing list. A linkage line is enough.
- Where you were unsure of a specific figure, remove the figure and explain the concept instead of guessing again.

This page is only "${spec.title}". Syllabus line for context: ${spec.syllabusAnchor}`,
    },
  ];
}
