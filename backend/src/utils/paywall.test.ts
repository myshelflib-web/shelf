import { describe, expect, it } from "vitest";
import { isPremiumUser, truncateHtmlPreview } from "./paywall.js";

describe("isPremiumUser", () => {
  it("treats admins as premium", () => {
    expect(
      isPremiumUser({
        plan: "FREE",
        role: "ADMIN",
        subscriptionExpiresAt: null,
      })
    ).toBe(true);
  });

  it("rejects free students", () => {
    expect(
      isPremiumUser({
        plan: "FREE",
        role: "STUDENT",
        subscriptionExpiresAt: null,
      })
    ).toBe(false);
  });

  it("respects subscription expiry", () => {
    const past = new Date(Date.now() - 60_000);
    const future = new Date(Date.now() + 60_000);
    expect(
      isPremiumUser({
        plan: "PREMIUM",
        role: "STUDENT",
        subscriptionExpiresAt: past,
      })
    ).toBe(false);
    expect(
      isPremiumUser({
        plan: "PREMIUM",
        role: "STUDENT",
        subscriptionExpiresAt: future,
      })
    ).toBe(true);
  });
});

describe("truncateHtmlPreview", () => {
  it("keeps a fraction of block elements", () => {
    const html =
      "<p>one</p><p>two</p><p>three</p><p>four</p><p>five</p><p>six</p><p>seven</p><p>eight</p><p>nine</p><p>ten</p>";
    const preview = truncateHtmlPreview(html, 30);
    expect(preview.split("</p>").length - 1).toBe(3);
  });
});
