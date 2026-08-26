import type { Coupon } from "@prisma/client";
import { computeCouponDiscount } from "./coupons.js";

/** Razorpay rejects ₹0 orders; free activations skip the gateway. */
export const MIN_CHARGE_PAISE = 100;

export type PriceBreakdown = {
  listAmount: number;
  couponDiscount: number;
  coinsApplied: number;
  chargeAmount: number;
  fullyCoveredByCredit: boolean;
};

export function priceOrder(opts: {
  listAmount: number;
  coupon: Pick<Coupon, "type" | "value" | "minAmount"> | null;
  coinBalance: number;
  applyCoins: boolean;
}): PriceBreakdown {
  const listAmount = Math.max(0, opts.listAmount);
  const couponDiscount = opts.coupon
    ? computeCouponDiscount(listAmount, opts.coupon)
    : 0;
  const afterCoupon = Math.max(0, listAmount - couponDiscount);
  const coinsApplied = opts.applyCoins
    ? Math.min(Math.max(0, opts.coinBalance), afterCoupon)
    : 0;
  const chargeAmount = Math.max(0, afterCoupon - coinsApplied);
  return {
    listAmount,
    couponDiscount,
    coinsApplied,
    chargeAmount,
    fullyCoveredByCredit: chargeAmount === 0 && (coinsApplied > 0 || couponDiscount >= listAmount),
  };
}
