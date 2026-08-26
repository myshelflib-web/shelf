import type { Coupon, CouponType } from "@prisma/client";
import prisma from "../../utils/prisma.js";

export class CouponError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function normalizeCouponCode(code: string): string {
  return code.trim().toUpperCase();
}

export function computeCouponDiscount(
  listAmount: number,
  coupon: Pick<Coupon, "type" | "value" | "minAmount">
): number {
  if (coupon.minAmount != null && listAmount < coupon.minAmount) {
    return 0;
  }
  if (coupon.type === "PERCENT") {
    const pct = Math.min(100, Math.max(0, coupon.value));
    return Math.floor((listAmount * pct) / 100);
  }
  return Math.min(listAmount, Math.max(0, coupon.value));
}

export async function findValidCoupon(code: string, userId: string, listAmount: number) {
  const normalized = normalizeCouponCode(code);
  if (!normalized) {
    throw new CouponError("Coupon code required");
  }

  const coupon = await prisma.coupon.findUnique({ where: { code: normalized } });
  if (!coupon || !coupon.active) {
    throw new CouponError("Invalid or inactive coupon");
  }

  const now = new Date();
  if (coupon.validFrom && coupon.validFrom > now) {
    throw new CouponError("Coupon is not active yet");
  }
  if (coupon.validUntil && coupon.validUntil < now) {
    throw new CouponError("Coupon has expired");
  }
  if (coupon.maxUses != null && coupon.usedCount >= coupon.maxUses) {
    throw new CouponError("Coupon has reached its usage limit");
  }
  if (coupon.minAmount != null && listAmount < coupon.minAmount) {
    throw new CouponError(
      `Minimum order amount is ₹${(coupon.minAmount / 100).toFixed(0)}`
    );
  }

  if (coupon.maxUsesPerUser > 0) {
    const usedByUser = await prisma.couponRedemption.count({
      where: { couponId: coupon.id, userId },
    });
    if (usedByUser >= coupon.maxUsesPerUser) {
      throw new CouponError("You have already used this coupon");
    }
  }

  const discount = computeCouponDiscount(listAmount, coupon);
  if (discount <= 0) {
    throw new CouponError("Coupon does not apply to this order");
  }

  return { coupon, discount };
}

export function parseCouponType(raw: unknown): CouponType {
  if (raw === "PERCENT" || raw === "FIXED") return raw;
  throw new CouponError("type must be PERCENT or FIXED");
}
