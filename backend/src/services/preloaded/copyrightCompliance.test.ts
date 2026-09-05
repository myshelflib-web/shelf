import { describe, expect, it } from "vitest";
import {
  auditCopyrightCompliance,
  isOfficialRedistributionHost,
} from "./copyrightCompliance.js";

describe("copyrightCompliance", () => {
  it("allowlists known government textbook hosts", () => {
    expect(isOfficialRedistributionHost("https://ncert.nic.in/textbook/pdf/a.pdf")).toBe(
      true
    );
    expect(isOfficialRedistributionHost("https://upsc.gov.in/doc.pdf")).toBe(true);
    expect(isOfficialRedistributionHost("https://www.upsc.gov.in/doc.pdf")).toBe(
      true
    );
    expect(
      isOfficialRedistributionHost(
        "https://gate2026.iitg.ac.in/doc/GATE2026_Syllabus/CS_2026_Syllabus.pdf"
      )
    ).toBe(true);
    expect(isOfficialRedistributionHost("https://www.indiabudget.gov.in/doc.pdf")).toBe(
      true
    );
    expect(
      isOfficialRedistributionHost("https://rpsc.rajasthan.gov.in/Static/Syllabus/a.pdf")
    ).toBe(true);
    expect(
      isOfficialRedistributionHost(
        "https://delhihighcourt.nic.in/files/2026-02/djs.pdf"
      )
    ).toBe(true);
    expect(isOfficialRedistributionHost("https://openstax.org/details/books/bio")).toBe(
      false
    );
  });

  it("catalog audit has no error-level findings for seeded entries", () => {
    const report = auditCopyrightCompliance();
    expect(report.summary.error).toBe(0);
    expect(report.summary.linkOnlyCatalogEntries).toBe(0);
  });
});
