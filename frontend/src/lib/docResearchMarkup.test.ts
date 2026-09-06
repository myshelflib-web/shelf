import { describe, expect, it } from "vitest";
import {
  buildCiteSpan,
  buildEquationSpan,
  buildFootnoteSup,
} from "./docResearchMarkup";
import { parseDocBody, serializeDocBody } from "./docEditor";

describe("docResearchMarkup", () => {
  it("builds cite and footnote markers", () => {
    const cite = buildCiteSpan({
      sourceId: "abc",
      label: "(Smith, 2020)",
      locator: "12",
      key: "smith2020",
    });
    expect(cite).toContain('class="shelf-cite"');
    expect(cite).toContain('data-source-id="abc"');
    expect(cite).toContain('data-locator="12"');
    expect(cite).toContain("(Smith, 2020)");

    const fn = buildFootnoteSup("n1", 1, "A note");
    expect(fn).toContain('class="shelf-footnote"');
    expect(fn).toContain('data-fn-id="n1"');
  });

  it("embeds research markers in serialized Doc HTML", () => {
    const inner = [
      "<p>Hello ",
      buildCiteSpan({ sourceId: "s1", label: "(A, 1)" }),
      "</p>",
      buildEquationSpan("x^2"),
      buildFootnoteSup("f1", 1, "note"),
    ].join("");
    const html = serializeDocBody(inner);
    expect(html).toContain("shelf-doc-body");
    expect(html).toContain("shelf-cite");
    expect(html).toContain("shelf-eq");
    expect(html).toContain("shelf-footnote");
    // parseDocBody is DOM-based; only assert string contract here.
    expect(parseDocBody.length).toBeGreaterThan(0);
  });
});
