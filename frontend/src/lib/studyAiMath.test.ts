import { describe, expect, it } from "vitest";
import {
  inlineMarkdownToExportHtml,
  looksLikeTex,
  normalizeStudyMarkdown,
  renderMathHtml,
  splitInlineMath,
} from "./studyAiMath";

describe("studyAiMath", () => {
  it("splits inline dollar math", () => {
    expect(splitInlineMath("Energy is $E=mc^2$ here")).toEqual([
      { kind: "text", value: "Energy is " },
      { kind: "math", value: "E=mc^2", display: false },
      { kind: "text", value: " here" },
    ]);
  });

  it("splits intervals and underlined symbols", () => {
    expect(splitInlineMath("on $[0, 1]$ the sum $\\underline{I}(f)$")).toEqual([
      { kind: "text", value: "on " },
      { kind: "math", value: "[0, 1]", display: false },
      { kind: "text", value: " the sum " },
      { kind: "math", value: "\\underline{I}(f)", display: false },
    ]);
  });

  it("splits paren-style inline math", () => {
    expect(splitInlineMath("Let \\(x^2\\) be")).toEqual([
      { kind: "text", value: "Let " },
      { kind: "math", value: "x^2", display: false },
      { kind: "text", value: " be" },
    ]);
  });

  it("lifts inline $$ and latex fences into display blocks", () => {
    const out = normalizeStudyMarkdown(
      "Additivity: $$\\int_a^b [s+t]\\,dx$$ holds.\n```latex\n\\sum k^3\n```"
    );
    expect(out).toContain("$$\n\\int_a^b [s+t]\\,dx\n$$");
    expect(out).toContain("$$\n\\sum k^3\n$$");
  });

  it("wraps a TeX line that only has a closing $$", () => {
    const out = normalizeStudyMarkdown(
      "\\int_{b}^{a} [s(x)+t(x)] \\, dx$$"
    );
    expect(out).toContain("$$\n\\int_{b}^{a} [s(x)+t(x)] \\, dx\n$$");
  });

  it("does not treat a heading as tex", () => {
    expect(looksLikeTex("### Gaps")).toBe(false);
    expect(looksLikeTex("\\int_a^b f(x)\\,dx")).toBe(true);
  });

  it("renders math html without throwing on bad tex", () => {
    const html = renderMathHtml("\\notarealcommand", false);
    expect(html).toContain("notarealcommand");
  });

  it("exports inline math in html", () => {
    const html = inlineMarkdownToExportHtml("See $a+b$");
    expect(html).toContain("katex");
  });
});
