import { describe, expect, it } from "vitest";

/** Node-safe smoke checks for Doc export string contracts (no DOM). */
describe("docExport contracts", () => {
  it("markdown cite/footnote patterns match markup attrs", () => {
    const html = `<span class="shelf-cite" data-bibtex-key="smith2020"></span><sup class="shelf-footnote" data-fn-id="n1"></sup>`;
    const key = html.match(/data-bibtex-key="([^"]+)"/)?.[1];
    const fn = html.match(/data-fn-id="([^"]+)"/)?.[1];
    expect(`[@${key}]`).toBe("[@smith2020]");
    expect(`[^${fn}]`).toBe("[^n1]");
  });

  it("latex bibliography stub shape", () => {
    const keys = ["smith2020", "doe2021"];
    const bib = `\\begin{thebibliography}{99}\n${keys
      .map((k) => `\\bibitem{${k}} ${k}`)
      .join("\n")}\n\\end{thebibliography}`;
    expect(bib).toContain("\\bibitem{smith2020}");
    expect(bib).toContain("\\begin{thebibliography}");
  });
});
