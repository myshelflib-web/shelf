import { describe, expect, it } from "vitest";
import { computeCouponDiscount } from "./coupons.js";
import { priceOrder } from "./pricing.js";
import { computeAffiliateCoins } from "./affiliates.js";
import { computePremiumExpiry } from "./activate.js";

describe("computeCouponDiscount", () => {
  it("applies percent off", () => {
    expect(
      computeCouponDiscount(10000, { type: "PERCENT", value: 20, minAmount: null })
    ).toBe(2000);
  });

  it("applies fixed off capped at list", () => {
    expect(
      computeCouponDiscount(500, { type: "FIXED", value: 2000, minAmount: null })
    ).toBe(500);
  });

  it("respects minAmount", () => {
    expect(
      computeCouponDiscount(500, { type: "FIXED", value: 100, minAmount: 1000 })
    ).toBe(0);
  });
});

describe("priceOrder", () => {
  it("stacks coupon then coins", () => {
    const priced = priceOrder({
      listAmount: 99900,
      coupon: { type: "PERCENT", value: 10, minAmount: null },
      coinBalance: 5000,
      applyCoins: true,
    });
    expect(priced.couponDiscount).toBe(9990);
    expect(priced.coinsApplied).toBe(5000);
    expect(priced.chargeAmount).toBe(99900 - 9990 - 5000);
  });

  it("can fully cover with coins", () => {
    const priced = priceOrder({
      listAmount: 1000,
      coupon: null,
      coinBalance: 5000,
      applyCoins: true,
    });
    expect(priced.chargeAmount).toBe(0);
    expect(priced.fullyCoveredByCredit).toBe(true);
  });
});

describe("computeAffiliateCoins", () => {
  it("credits 10% by default", () => {
    expect(computeAffiliateCoins(10000)).toBe(1000);
  });
});

describe("computePremiumExpiry", () => {
  it("extends from current expiry when still active", () => {
    const now = new Date("2026-06-01T00:00:00Z");
    const current = new Date("2026-08-01T00:00:00Z");
    const expires = computePremiumExpiry(current, 30, now);
    expect(expires.toISOString().startsWith("2026-08-31")).toBe(true);
  });

  it("starts from now when expired", () => {
    const now = new Date("2026-06-01T00:00:00Z");
    const current = new Date("2026-01-01T00:00:00Z");
    const expires = computePremiumExpiry(current, 30, now);
    expect(expires.toISOString().startsWith("2026-07-01")).toBe(true);
  });
});
