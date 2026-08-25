import { describe, expect, it } from "vitest";
import {
  FREE_RELEVANCY_DOCS,
  PREMIUM_RELEVANCY_DOCS,
  assertRelevancyDocRoom,
  relevancyDocLimit,
} from "./quotas.js";

describe("relevancy doc quotas", () => {
  it("limits free users to 10 and premium to 50", () => {
    expect(relevancyDocLimit({ plan: "FREE", role: "STUDENT" })).toBe(
      FREE_RELEVANCY_DOCS
    );
    expect(relevancyDocLimit({ plan: "PREMIUM", role: "STUDENT" })).toBe(
      PREMIUM_RELEVANCY_DOCS
    );
    expect(relevancyDocLimit({ plan: "FREE", role: "ADMIN" })).toBe(
      PREMIUM_RELEVANCY_DOCS
    );
  });

  it("rejects creating past the free cap", () => {
    expect(() =>
      assertRelevancyDocRoom(
        { plan: "FREE", role: "STUDENT" },
        FREE_RELEVANCY_DOCS
      )
    ).toThrow(/Free plan allows 10/);
  });

  it("allows create under the free cap", () => {
    expect(() =>
      assertRelevancyDocRoom({ plan: "FREE", role: "STUDENT" }, 0)
    ).not.toThrow();
  });
});
