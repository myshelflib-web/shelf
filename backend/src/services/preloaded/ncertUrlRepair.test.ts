import { describe, expect, it } from "vitest";
import { ncertPdfRepairCandidates } from "./ncertUrlRepair.js";

describe("ncertPdfRepairCandidates", () => {
  it("suggests ps suffix and known renames", () => {
    const url = "https://ncert.nic.in/textbook/pdf/leps1.pdf";
    expect(ncertPdfRepairCandidates(url)).toContain(
      "https://ncert.nic.in/textbook/pdf/leps1ps.pdf"
    );
  });

  it("maps retired book codes", () => {
    expect(
      ncertPdfRepairCandidates(
        "https://ncert.nic.in/textbook/pdf/iess4.pdf"
      )
    ).toContain("https://ncert.nic.in/textbook/pdf/jess4ps.pdf");
  });

  it("ignores non-ncert urls", () => {
    expect(ncertPdfRepairCandidates("https://example.com/a.pdf")).toEqual([]);
  });
});
