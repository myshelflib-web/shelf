import type { ChatMessage } from "../../llmTypes.js";
import type { NewsBrief, NewsCluster } from "./newsTypes.js";

const COPYRIGHT_RULES = [
  "You are synthesising, not reproducing. Write every sentence from scratch in your own words.",
  "Never copy a phrase of more than six consecutive words from the input material.",
  "Do not invent facts. If a detail is not present in the input material, leave it out — do not fill the gap from memory.",
  "Numbers, names, dates and scheme titles must appear in the input material exactly as you state them.",
  "No quotations, no verbatim headlines, no restating a single outlet's framing.",
].join(" ");

function clusterFacts(cluster: NewsCluster): string {
  return cluster.items
    .map(
      (item, i) =>
        `SOURCE ${i + 1} — ${item.sourceName}\nHeadline topic: ${item.title}\nSummary: ${
          item.summary || "(none)"
        }\nFactual excerpt: ${item.excerpt || "(none)"}\nTags: ${item.tags.join(", ") || "(none)"}`
    )
    .join("\n\n");
}

export function newsBriefMessages(
  cluster: NewsCluster,
  examContext: string,
  examLabel: string
): ChatMessage[] {
  return [
    {
      role: "system",
      content: `You write current-affairs briefs for ${examLabel} aspirants. ${examContext} ${COPYRIGHT_RULES} You reply with a single JSON object and nothing else.`,
    },
    {
      role: "user",
      content: `${cluster.items.length} source${
        cluster.items.length > 1 ? "s" : ""
      } covered the same development. Write one original exam brief from the facts they share.

${clusterFacts(cluster)}

Return exactly:
{
  "title": "specific, factual, <= 70 characters — describe the development, not a headline",
  "metaDescription": "140-158 characters explaining what happened and why it matters for the exam",
  "whatHappened": ["2-3 short paragraphs of plain factual narration, written from scratch"],
  "whyItMatters": ["2-3 short paragraphs of analysis: significance, stakeholders, likely consequences"],
  "keyFacts": ["4-6 crisp facts a candidate must remember — only facts present above"],
  "syllabusLinks": ["3-5 exact syllabus areas this maps to"],
  "prelimsPointers": ["3-4 objective-style points likely to be tested"],
  "mainsAngle": ["2-3 analytical angles or answer-writing hooks"],
  "keywords": ["5-8 search phrases"]
}

If the source material is too thin to support an accurate brief, return {"title":"","metaDescription":"","whatHappened":[],"whyItMatters":[],"keyFacts":[],"syllabusLinks":[],"prelimsPointers":[],"mainsAngle":[],"keywords":[]} instead of guessing.

Plain text only inside every string: no markdown, no HTML, no source names in the body.`,
    },
  ];
}

export function newsReviewMessages(
  cluster: NewsCluster,
  brief: NewsBrief,
  examLabel: string
): ChatMessage[] {
  const draft = [
    brief.title,
    ...brief.whatHappened,
    ...brief.whyItMatters,
    ...brief.keyFacts,
    ...brief.prelimsPointers,
    ...brief.mainsAngle,
  ].join("\n");

  return [
    {
      role: "system",
      content: `You audit current-affairs briefs for ${examLabel} for two things: factual support and originality of expression. You reply with a single JSON object and nothing else.`,
    },
    {
      role: "user",
      content: `SOURCE MATERIAL:
${clusterFacts(cluster)}

DRAFT BRIEF:
${draft.slice(0, 16000)}

Return:
{
  "score": 0-100,
  "unsupported": ["claims in the draft that the source material does not support — quote the claim"],
  "copiedPhrases": ["any run of more than six consecutive words shared with the source material"],
  "verdict": "pass" or "revise"
}

Score 90+ only when every claim is supported and no phrase is copied. Use "revise" whenever score is below 85, or unsupported or copiedPhrases is non-empty.`,
    },
  ];
}

export function newsReviseMessages(
  cluster: NewsCluster,
  brief: NewsBrief,
  review: { unsupported: string[]; copiedPhrases: string[] },
  examLabel: string
): ChatMessage[] {
  return [
    {
      role: "system",
      content: `You revise current-affairs briefs for ${examLabel}. ${COPYRIGHT_RULES} You reply with a single JSON object in the same shape you were given and nothing else.`,
    },
    {
      role: "user",
      content: `SOURCE MATERIAL:
${clusterFacts(cluster)}

CURRENT DRAFT:
${JSON.stringify(brief).slice(0, 16000)}

UNSUPPORTED CLAIMS — delete these or replace them with something the sources do support:
${review.unsupported.length ? review.unsupported.map((u) => `- ${u}`).join("\n") : "- none"}

COPIED PHRASING — rewrite these completely:
${review.copiedPhrases.length ? review.copiedPhrases.map((c) => `- ${c}`).join("\n") : "- none"}

Return the corrected brief in the identical JSON shape.`,
    },
  ];
}
