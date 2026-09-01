import { describe, expect, it } from "vitest";
import { extractJsonObject } from "./jsonExtract.js";
import { parseGeneratedArticle, parseRelevanceReview } from "./parseArticle.js";
import { renderDiagramHtml } from "./renderDiagram.js";

const VALID_ARTICLE = {
  title: "Basic Structure Doctrine",
  metaDescription: "What the doctrine means and how it is asked.",
  intro: "The doctrine limits amending power.",
  sections: [
    { heading: "Origin", paragraphs: ["Text one.", "Text two."] },
    {
      heading: "Scope",
      paragraphs: ["Text three."],
      bullets: ["A", "B"],
      table: {
        caption: "Compare the two",
        columns: ["Case", "Held"],
        rows: [
          ["Golaknath", "No abridgement"],
          ["Kesavananda", "Basic structure"],
        ],
      },
    },
    { heading: "Criticism", paragraphs: ["Text four."] },
  ],
  keyTakeaways: ["Point one"],
  examPointers: ["Asked in Prelims"],
  commonMistakes: ["Do not confuse the two"],
  linkages: ["Connects to judicial review"],
  diagram: {
    kind: "timeline",
    title: "Evolution",
    steps: [
      { label: "1951", detail: "Shankari Prasad" },
      { label: "1973", detail: "Kesavananda Bharati" },
    ],
  },
  keywords: ["basic structure"],
};

describe("extractJsonObject", () => {
  it("pulls JSON out of fenced, chatty replies", () => {
    const raw = 'Sure!\n```json\n{"a": {"b": 1}}\n```\nHope that helps.';
    expect(extractJsonObject(raw)).toBe('{"a": {"b": 1}}');
  });

  it("is not confused by braces inside strings", () => {
    expect(extractJsonObject('{"a": "} not the end"}')).toBe(
      '{"a": "} not the end"}'
    );
  });

  it("returns null when there is no object", () => {
    expect(extractJsonObject("no json here")).toBeNull();
  });
});

describe("parseGeneratedArticle", () => {
  it("parses a well-formed draft", () => {
    const article = parseGeneratedArticle(JSON.stringify(VALID_ARTICLE));
    expect(article?.title).toBe("Basic Structure Doctrine");
    expect(article?.sections).toHaveLength(3);
    expect(article?.diagram?.kind).toBe("timeline");
  });

  it("rejects a draft with too few usable sections", () => {
    const thin = { ...VALID_ARTICLE, sections: [VALID_ARTICLE.sections[0]] };
    expect(parseGeneratedArticle(JSON.stringify(thin))).toBeNull();
  });

  it("drops a diagram that does not have enough entries", () => {
    const bad = {
      ...VALID_ARTICLE,
      diagram: { kind: "timeline", title: "x", steps: [{ label: "only one" }] },
    };
    expect(parseGeneratedArticle(JSON.stringify(bad))?.diagram).toBeNull();
  });

  it("keeps a well-formed table and pads short rows", () => {
    const withShortRow = structuredClone(VALID_ARTICLE);
    withShortRow.sections[1].table!.rows.push(["Minerva Mills"]);

    const table = parseGeneratedArticle(JSON.stringify(withShortRow))
      ?.sections[1].table;
    expect(table?.columns).toEqual(["Case", "Held"]);
    expect(table?.rows).toHaveLength(3);
    expect(table?.rows[2]).toEqual(["Minerva Mills", ""]);
  });

  it("drops a table that has no usable rows", () => {
    const bad = structuredClone(VALID_ARTICLE);
    bad.sections[1].table!.rows = [["only one row", "x"]];
    expect(parseGeneratedArticle(JSON.stringify(bad))?.sections[1].table).toBeNull();
  });
});

describe("parseRelevanceReview", () => {
  it("passes only when the score is high and nothing was flagged", () => {
    const review = parseRelevanceReview(
      '{"score": 92, "missing": [], "corrections": [], "vague": [], "verdict": "pass"}'
    );
    expect(review?.verdict).toBe("pass");
  });

  it("forces a revise when corrections exist despite a pass verdict", () => {
    const review = parseRelevanceReview(
      '{"score": 95, "missing": [], "corrections": ["wrong year"], "verdict": "pass"}'
    );
    expect(review?.verdict).toBe("revise");
  });

  it("forces a revise when the reviewer flagged filler", () => {
    const review = parseRelevanceReview(
      '{"score": 95, "missing": [], "corrections": [], "vague": ["plays a vital role"], "verdict": "pass"}'
    );
    expect(review?.verdict).toBe("revise");
  });

  it("forces a revise when the score is below the pass bar", () => {
    const review = parseRelevanceReview(
      '{"score": 70, "missing": ["Article 368"], "corrections": [], "verdict": "pass"}'
    );
    expect(review?.verdict).toBe("revise");
  });
});

describe("renderDiagramHtml", () => {
  it("renders class-annotated HTML that survives the reader sanitizer", () => {
    const html = renderDiagramHtml({
      kind: "flow",
      title: "Process",
      steps: [{ label: "Step one" }, { label: "Step two", detail: "Detail" }],
    });
    expect(html).toContain("shelf-diagram--flow");
    expect(html).not.toContain("<svg");
    expect(html).not.toContain("style=");
  });

  it("escapes untrusted text", () => {
    const html = renderDiagramHtml({
      kind: "compare",
      title: "<script>alert(1)</script>",
      rows: [
        { left: "a", right: "b" },
        { left: "c", right: "d" },
      ],
    });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("renders nothing when there is no diagram", () => {
    expect(renderDiagramHtml(null)).toBe("");
  });
});
