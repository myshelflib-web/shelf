import crypto from "crypto";
import prisma from "../../utils/prisma.js";
import { affiliateCommissionBps } from "./plans.js";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateAffiliateCode(length = 8): string {
  const bytes = crypto.randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += CODE_ALPHABET[bytes[i]! % CODE_ALPHABET.length];
  }
  return out;
}

export async function ensureAffiliateProfile(userId: string) {
  const existing = await prisma.affiliateProfile.findUnique({
    where: { userId },
  });
  if (existing) return existing;

  for (let attempt = 0; attempt < 8; attempt++) {
    const code = generateAffiliateCode();
    try {
      return await prisma.affiliateProfile.create({
        data: { userId, code },
      });
    } catch {
      // unique collision — retry
    }
  }
  throw new Error("Could not allocate affiliate code");
}

export function computeAffiliateCoins(paidAmountPaise: number): number {
  const bps = affiliateCommissionBps();
  return Math.floor((paidAmountPaise * bps) / 10_000);
}

/**
 * Credit affiliate coins after a successful payment. Idempotent per paymentId.
 * Skips self-referrals and missing codes.
 */
export async function creditAffiliateForPayment(opts: {
  paymentId: string;
  referredUserId: string;
  affiliateCode: string | null | undefined;
  paidAmountPaise: number;
}) {
  const code = opts.affiliateCode?.trim().toUpperCase();
  if (!code || opts.paidAmountPaise <= 0) return null;

  const existing = await prisma.affiliateEarning.findUnique({
    where: { paymentId: opts.paymentId },
  });
  if (existing) return existing;

  const profile = await prisma.affiliateProfile.findUnique({
    where: { code },
  });
  if (!profile || profile.userId === opts.referredUserId) return null;

  const coins = computeAffiliateCoins(opts.paidAmountPaise);
  if (coins <= 0) return null;

  const [, earning] = await prisma.$transaction([
    prisma.user.update({
      where: { id: profile.userId },
      data: { coinBalance: { increment: coins } },
    }),
    prisma.affiliateEarning.create({
      data: {
        affiliateUserId: profile.userId,
        referredUserId: opts.referredUserId,
        paymentId: opts.paymentId,
        amountCoins: coins,
      },
    }),
  ]);

  return earning;
}
