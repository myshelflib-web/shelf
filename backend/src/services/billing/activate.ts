import prisma from "../../utils/prisma.js";
import {
  sendEmailInBackground,
  subscriptionThankYouEmail,
} from "../email/index.js";
import { creditAffiliateForPayment } from "./affiliates.js";

export function computePremiumExpiry(
  currentExpiresAt: Date | null | undefined,
  planDays: number,
  from = new Date()
): Date {
  const base =
    currentExpiresAt && currentExpiresAt.getTime() > from.getTime()
      ? currentExpiresAt
      : from;
  const expires = new Date(base);
  expires.setDate(expires.getDate() + planDays);
  return expires;
}

/**
 * Mark payment complete, extend Premium, record coupon redemption,
 * deduct applied coins, credit affiliate. Idempotent if already COMPLETED.
 */
export async function activatePremiumFromPayment(opts: {
  paymentId: string;
  providerPaymentId: string;
}) {
  const payment = await prisma.payment.findUnique({
    where: { id: opts.paymentId },
  });
  if (!payment) {
    throw new Error("Payment not found");
  }
  if (payment.status === "COMPLETED") {
    const user = await prisma.user.findUnique({
      where: { id: payment.userId },
      select: { subscriptionExpiresAt: true, email: true, name: true },
    });
    return {
      alreadyActivated: true as const,
      expiresAt: user?.subscriptionExpiresAt ?? null,
      email: user?.email,
      name: user?.name,
      payment,
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: payment.userId },
    select: {
      subscriptionExpiresAt: true,
      email: true,
      name: true,
      coinBalance: true,
    },
  });
  if (!user) {
    throw new Error("User not found");
  }

  const coinsToApply = Math.min(
    Math.max(0, payment.coinsApplied),
    user.coinBalance
  );
  const expiresAt = computePremiumExpiry(
    user.subscriptionExpiresAt,
    payment.planDays
  );

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: "COMPLETED",
        providerPaymentId: opts.providerPaymentId,
        completedAt: new Date(),
        coinsApplied: coinsToApply,
      },
    });

    await tx.user.update({
      where: { id: payment.userId },
      data: {
        plan: "PREMIUM",
        subscriptionExpiresAt: expiresAt,
        ...(coinsToApply > 0
          ? { coinBalance: { decrement: coinsToApply } }
          : {}),
      },
    });

    if (payment.couponId) {
      const existing = await tx.couponRedemption.findUnique({
        where: { paymentId: payment.id },
      });
      if (!existing) {
        await tx.couponRedemption.create({
          data: {
            couponId: payment.couponId,
            userId: payment.userId,
            paymentId: payment.id,
          },
        });
        await tx.coupon.update({
          where: { id: payment.couponId },
          data: { usedCount: { increment: 1 } },
        });
      }
    }
  });

  await creditAffiliateForPayment({
    paymentId: payment.id,
    referredUserId: payment.userId,
    affiliateCode: payment.affiliateCode,
    paidAmountPaise: payment.amount,
  });

  sendEmailInBackground({
    to: user.email,
    ...subscriptionThankYouEmail(
      user.name,
      expiresAt,
      payment.planDays,
      payment.amount
    ),
  });

  return {
    alreadyActivated: false as const,
    expiresAt,
    email: user.email,
    name: user.name,
    payment,
  };
}

/** Extend Premium for a recurring charge (no Payment row required). */
export async function activatePremiumForUser(opts: {
  userId: string;
  planDays: number;
  amountPaise: number;
  affiliateCode?: string | null;
  /** Synthetic id used only for affiliate idempotency when no Payment exists. */
  affiliateIdempotencyKey?: string;
}) {
  const user = await prisma.user.findUnique({
    where: { id: opts.userId },
    select: {
      subscriptionExpiresAt: true,
      email: true,
      name: true,
    },
  });
  if (!user) throw new Error("User not found");

  const expiresAt = computePremiumExpiry(
    user.subscriptionExpiresAt,
    opts.planDays
  );

  await prisma.user.update({
    where: { id: opts.userId },
    data: {
      plan: "PREMIUM",
      subscriptionExpiresAt: expiresAt,
    },
  });

  return { expiresAt, email: user.email, name: user.name };
}
