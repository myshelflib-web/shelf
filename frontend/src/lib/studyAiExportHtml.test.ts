import { describe, expect, it } from "vitest";
import { markdownToExportHtml } from "./studyAiExportHtml";

describe("studyAiExportHtml", () => {
  it("renders mermaid blocks as export placeholders", () => {
    const html = markdownToExportHtml("```mermaid\nflowchart TD\nA-->B\n```");
    expect(html).toContain('class="mermaid-export"');
    expect(html).toContain("flowchart TD");
    expect(html).not.toContain("<pre");
  });

  it("renders markdown tables", () => {
    const html = markdownToExportHtml("| A | B |\n|---|---|\n| 1 | 2 |");
    expect(html).toContain("<table>");
    expect(html).toContain("<th>");
    expect(html).toContain("1");
  });

  it("renders inline math in paragraphs", () => {
    const html = markdownToExportHtml("Value is $\\\\sqrt{2}$ here.");
    expect(html).toContain("katex");
  });
});
