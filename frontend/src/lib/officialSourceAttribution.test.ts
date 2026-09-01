import { describe, expect, it } from "vitest";
import { formatOfficialSourceAttribution } from "./officialSourceAttribution";

describe("formatOfficialSourceAttribution", () => {
  it("labels NCERT PDFs", () => {
    expect(
      formatOfficialSourceAttribution(
        "https://ncert.nic.in/textbook/pdf/hess301.pdf"
      )
    ).toEqual({
      label: "NCERT",
      url: "https://ncert.nic.in/textbook/pdf/hess301.pdf",
    });
  });

  it("returns null for empty input", () => {
    expect(formatOfficialSourceAttribution(null)).toBeNull();
  });
});
