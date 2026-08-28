import { describe, expect, it } from "vitest";
import { apiKeyRouteForUser } from "./apiKeyRoute.js";

describe("apiKeyRoute", () => {
  it("routes free students to the free API key pool", () => {
    expect(
      apiKeyRouteForUser({ plan: "FREE", role: "STUDENT" })
    ).toBe("free");
  });

  it("routes premium and admin to the paid API key pool", () => {
    expect(
      apiKeyRouteForUser({
        plan: "PREMIUM",
        role: "STUDENT",
        subscriptionExpiresAt: new Date(Date.now() + 86_400_000),
      })
    ).toBe("paid");
    expect(apiKeyRouteForUser({ plan: "FREE", role: "ADMIN" })).toBe("paid");
  });
});
