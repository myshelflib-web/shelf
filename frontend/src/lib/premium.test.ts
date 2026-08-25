import { describe, expect, it } from "vitest";
import { isPremiumUser } from "./premium";

describe("isPremiumUser", () => {
  it("returns false for missing user", () => {
    expect(isPremiumUser(null)).toBe(false);
  });

  it("returns true for admin", () => {
    expect(
      isPremiumUser({
        id: "1",
        email: "a@b.c",
        name: "A",
        role: "ADMIN",
        plan: "FREE",
      })
    ).toBe(true);
  });

  it("returns true for active premium", () => {
    expect(
      isPremiumUser({
        id: "1",
        email: "a@b.c",
        name: "A",
        role: "STUDENT",
        plan: "PREMIUM",
        subscriptionExpiresAt: new Date(Date.now() + 86_400_000).toISOString(),
      })
    ).toBe(true);
  });

  it("returns false for expired premium", () => {
    expect(
      isPremiumUser({
        id: "1",
        email: "a@b.c",
        name: "A",
        role: "STUDENT",
        plan: "PREMIUM",
        subscriptionExpiresAt: new Date(Date.now() - 86_400_000).toISOString(),
      })
    ).toBe(false);
  });
});
