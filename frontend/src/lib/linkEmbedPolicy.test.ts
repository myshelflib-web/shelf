import { describe, expect, it } from "vitest";
import {
  isKnownNonEmbedUrl,
  isPdfSourceUrl,
  linkEmbedHint,
  shouldUseLinkEmbed,
} from "./linkEmbedPolicy";

describe("linkEmbedPolicy", () => {
  it("detects pdf urls", () => {
    expect(isPdfSourceUrl("https://ncert.nic.in/pdf/a.pdf")).toBe(true);
    expect(isPdfSourceUrl("https://example.com/page")).toBe(false);
  });

  it("blocks government portals even when embeddable is true", () => {
    expect(isKnownNonEmbedUrl("https://www.mca.gov.in/")).toBe(true);
    expect(
      shouldUseLinkEmbed({
        sourceUrl: "https://www.mca.gov.in/",
        embeddable: true,
        linkStatus: "OK",
        sourceLicense: "LINK_ONLY",
      })
    ).toBe(false);
  });

  it("only embeds when explicitly allowed", () => {
    expect(
      shouldUseLinkEmbed({
        sourceUrl: "https://example.com",
        embeddable: true,
      })
    ).toBe(true);
    expect(
      shouldUseLinkEmbed({
        sourceUrl: "https://ncert.nic.in/textbook.php",
        embeddable: null,
      })
    ).toBe(false);
    expect(
      shouldUseLinkEmbed({
        sourceUrl: "https://ncert.nic.in/textbook.php",
        linkStatus: "BLOCKED_EMBED",
      })
    ).toBe(false);
  });

  it("probes unknown html links", () => {
    expect(
      linkEmbedHint({
        sourceUrl: "https://example.com/page",
        embeddable: null,
      })
    ).toBe(null);
    expect(
      linkEmbedHint({
        sourceUrl: "https://ncert.nic.in/textbook.php",
        embeddable: null,
      })
    ).toBe(false);
  });
});
