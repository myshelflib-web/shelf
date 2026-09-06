import { describe, expect, it } from "vitest";
import {
  formatBibliographyEntry,
  formatInText,
} from "./citationFormat.js";
import { parseBibtex } from "./bibtexParse.js";

const sample = {
  id: "1",
  title: "Attention Is All You Need",
  authors: [{ family: "Vaswani", given: "Ashish" }],
  year: "2017",
  container: "NeurIPS",
  bibtexKey: "vaswani2017",
};

describe("citationFormat", () => {
  it("formats APA in-text with locator", () => {
    expect(
      formatInText([{ ...sample, locator: "3" }], "apa")
    ).toBe("(Vaswani, 2017, p. 3)");
  });

  it("formats APA bibliography", () => {
    const line = formatBibliographyEntry(sample, "apa");
    expect(line).toContain("Vaswani");
    expect(line).toContain("2017");
    expect(line).toContain("Attention Is All You Need");
  });

  it("formats MLA Chicago IEEE in-text", () => {
    expect(formatInText([sample], "mla")).toMatch(/Vaswani/);
    expect(formatInText([sample], "chicago")).toMatch(/Vaswani/);
    expect(formatInText([sample], "ieee")).toMatch(/\[1\]|Vaswani/);
  });
});

describe("parseBibtex", () => {
  it("parses a simple article", () => {
    const entries = parseBibtex(`
@article{vaswani2017,
  title = {Attention Is All You Need},
  author = {Vaswani, Ashish and Shazeer, Noam},
  year = {2017},
  journal = {NeurIPS}
}
`);
    expect(entries.length).toBe(1);
    expect(entries[0]?.bibtexKey).toBe("vaswani2017");
    expect(entries[0]?.title).toContain("Attention");
  });
});
