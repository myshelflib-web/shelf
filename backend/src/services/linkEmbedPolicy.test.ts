import { describe, expect, it } from "vitest";
import {
  applyLinkEmbedPolicy,
  effectiveLinkEmbeddable,
  isKnownNonEmbedUrl,
  linkEmbedBlockedByPolicy,
} from "./linkEmbedPolicy.js";

describe("linkEmbedPolicy", () => {
  it("blocks common Indian government portal hosts", () => {
    expect(isKnownNonEmbedUrl("https://www.mca.gov.in/")).toBe(true);
    expect(isKnownNonEmbedUrl("https://ncert.nic.in/textbook.php")).toBe(true);
    expect(isKnownNonEmbedUrl("https://www.icai.org/")).toBe(true);
    expect(isKnownNonEmbedUrl("https://example.com/page")).toBe(false);
  });

  it("never embeds LINK_ONLY items", () => {
    expect(
      linkEmbedBlockedByPolicy({
        sourceUrl: "https://example.com/page",
        license: "LINK_ONLY",
      })
    ).toBe(true);
  });

  it("forces effective embeddable false for gov portals even when probe said true", () => {
    expect(
      effectiveLinkEmbeddable({
        sourceUrl: "https://www.mca.gov.in/",
        license: "LINK_ONLY",
        embeddable: true,
        linkStatus: "OK",
      })
    ).toBe(false);
  });

  it("rewrites probe results for blocked hosts", () => {
    expect(
      applyLinkEmbedPolicy(
        {
          embeddable: true,
          linkStatus: "OK",
          lastHttpStatus: 200,
          finalUrl: "https://www.mca.gov.in/",
        },
        { sourceUrl: "https://www.mca.gov.in/", license: "LINK_ONLY" }
      )
    ).toMatchObject({ embeddable: false, linkStatus: "BLOCKED_EMBED" });
  });
});
