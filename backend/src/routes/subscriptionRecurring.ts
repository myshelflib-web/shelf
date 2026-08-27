import { Router, Request, Response } from "express";
import crypto from "crypto";
import prisma from "../utils/prisma.js";
import { authMiddleware } from "../middleware/auth.js";
import { logger } from "../utils/logger.js";
import { metrics } from "../utils/metrics.js";
import { resolvePlan } from "../services/billing/plans.js";
import { findValidCoupon, CouponError } from "../services/billing/coupons.js";
import { priceOrder, MIN_CHARGE_PAISE } from "../services/billing/pricing.js";
import {
  razorpayConfigured,
  razorpayKeyId,
  razorpayRequest,
  ensureRazorpayPlan,
  RazorpayError,
  type RazorpaySubscription,
} from "../services/billing/razorpay.js";
import {
  activatePremiumFromPayment,
  activatePremiumForUser,
  computePremiumExpiry,
} from "../services/billing/activate.js";
import { toUserFacingError } from "../utils/userFacingError.js";

const router = Router();

function mapRazorpayStatus(status: string) {
  const s = status.toLowerCase();
  if (s === "created") return "CREATED" as const;
  if (s === "authenticated") return "AUTHENTICATED" as const;
  if (s === "active") return "ACTIVE" as const;
  if (s === "paused") return "PAUSED" as const;
  if (s === "halted") return "HALTED" as const;
  if (s === "cancelled") return "CANCELLED" as const;
  if (s === "completed") return "COMPLETED" as const;
  if (s === "expired") return "EXPIRED" as const;
  return "CREATED" as const;
}

router.post(
  "/create-subscription",
  authMiddleware,
  async (req: Request, res: Response) => {
    if (!razorpayConfigured()) {
      res.status(503).json({
        error: toUserFacingError(
          "Payments not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.",
          "Payments aren’t available right now. Please try again later."
        ),
      });
      return;
    }

    const intervalRaw =
      typeof req.body?.interval === "string" ? req.body.interval.toUpperCase() : "";
    if (intervalRaw !== "MONTHLY" && intervalRaw !== "YEARLY") {
      res.status(400).json({ error: "interval must be MONTHLY or YEARLY" });
      return;
    }

    const plan = resolvePlan(intervalRaw);
    const couponCode =
      typeof req.body?.couponCode === "string" ? req.body.couponCode : undefined;
    const affiliateCode =
      typeof req.body?.affiliateCode === "string"
        ? req.body.affiliateCode.trim().toUpperCase() || null
        : null;

    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, email: true, name: true, coinBalance: true },
    });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const existing = await prisma.recurringSubscription.findFirst({
      where: {
        userId: user.id,
        status: { in: ["CREATED", "AUTHENTICATED", "ACTIVE", "PAUSED"] },
      },
    });
    if (existing) {
      res.status(400).json({
        error: "You already have an active or pending recurring subscription",
      });
      return;
    }

    try {
      let coupon = null;
      if (couponCode?.trim()) {
        const found = await findValidCoupon(
          couponCode,
          user.id,
          plan.amountPaise
        );
        coupon = found.coupon;
      }

      // Coins apply to first cycle only via a parallel one-time path; recurring
      // charges use the plan amount. Coupon reduces first invoice via notes only
      // when charge still meets minimum — otherwise fall back to one-time order.
      const priced = priceOrder({
        listAmount: plan.amountPaise,
        coupon,
        coinBalance: 0,
        applyCoins: false,
      });

      if (priced.chargeAmount < MIN_CHARGE_PAISE) {
        res.status(400).json({
          error:
            "Discounted recurring amount is too low. Use a one-time purchase with coins for free/near-free upgrades.",
        });
        return;
      }

      const period = intervalRaw === "MONTHLY" ? "monthly" : "yearly";
      const providerPlanId = await ensureRazorpayPlan({
        cacheKey: `${period}:${plan.amountPaise}`,
        envVar:
          intervalRaw === "MONTHLY"
            ? "RAZORPAY_PLAN_MONTHLY_ID"
            : "RAZORPAY_PLAN_YEARLY_ID",
        period,
        amountPaise: priced.chargeAmount,
        name: `Shelf ${plan.label}`,
      });

      // 10 years of cycles as a soft ceiling; cancel anytime.
      const totalCount = intervalRaw === "MONTHLY" ? 120 : 10;

      let sub: RazorpaySubscription;
      try {
        sub = await razorpayRequest<RazorpaySubscription>(
          "POST",
          "/subscriptions",
          {
            plan_id: providerPlanId,
            total_count: totalCount,
            customer_notify: 1,
            notes: {
              userId: user.id,
              interval: intervalRaw,
              coupon: coupon?.code ?? "",
              affiliate: affiliateCode ?? "",
            },
          }
        );
      } catch (err) {
        metrics.inc("razorpay_subscriptions_total", { ok: false });
        (req.log ?? logger).error("razorpay.subscription.failed", {
          body: err instanceof RazorpayError ? err.body : String(err),
        });
        res.status(502).json({ error: "Failed to create subscription" });
        return;
      }

      await prisma.recurringSubscription.create({
        data: {
          userId: user.id,
          providerSubscriptionId: sub.id,
          providerPlanId,
          interval: intervalRaw,
          status: mapRazorpayStatus(sub.status),
          amount: priced.chargeAmount,
          currency: "INR",
          couponId: coupon?.id,
          affiliateCode,
        },
      });

      metrics.inc("razorpay_subscriptions_total", { ok: true });

      res.json({
        subscriptionId: sub.id,
        keyId: razorpayKeyId(),
        name: "Shelf Premium",
        description: `${plan.label} via UPI Autopay`,
        prefill: { name: user.name, email: user.email },
        interval: intervalRaw,
        amount: priced.chargeAmount,
        currency: "INR",
        recurring: true,
      });
    } catch (err) {
      if (err instanceof CouponError) {
        res.status(err.status).json({ error: err.message });
        return;
      }
      if (err instanceof RazorpayError) {
        res.status(502).json({ error: "Failed to set up recurring plan" });
        return;
      }
      throw err;
    }
  }
);

router.post(
  "/verify-subscription",
  authMiddleware,
  async (req: Request, res: Response) => {
    const { subscriptionId, paymentId, signature } = req.body as {
      subscriptionId?: string;
      paymentId?: string;
      signature?: string;
    };
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!subscriptionId || !paymentId || !signature || !keySecret) {
      res.status(400).json({
        error: "subscriptionId, paymentId, and signature required",
      });
      return;
    }

    const expected = crypto
      .createHmac("sha256", keySecret)
      .update(`${paymentId}|${subscriptionId}`)
      .digest("hex");

    if (expected !== signature) {
      res.status(400).json({ error: "Invalid payment signature" });
      return;
    }

    const sub = await prisma.recurringSubscription.findUnique({
      where: { providerSubscriptionId: subscriptionId },
    });
    if (!sub || sub.userId !== req.user!.userId) {
      res.status(404).json({ error: "Subscription not found" });
      return;
    }

    const planDays = resolvePlan(sub.interval).planDays;
    const user = await prisma.user.findUnique({
      where: { id: sub.userId },
      select: { subscriptionExpiresAt: true },
    });
    const expiresAt = computePremiumExpiry(
      user?.subscriptionExpiresAt,
      planDays
    );

    // Record a Payment row for affiliate/coupon accounting on first auth charge.
    let payment = await prisma.payment.findFirst({
      where: { providerPaymentId: paymentId },
    });
    if (!payment) {
      payment = await prisma.payment.create({
        data: {
          userId: sub.userId,
          providerOrderId: `sub_${subscriptionId}_${paymentId}`,
          providerPaymentId: paymentId,
          amount: sub.amount,
          listAmount: sub.amount,
          currency: sub.currency,
          planDays,
          billingInterval: sub.interval,
          couponId: sub.couponId,
          affiliateCode: sub.affiliateCode,
          status: "PENDING",
        },
      });
    }

    const result = await activatePremiumFromPayment({
      paymentId: payment.id,
      providerPaymentId: paymentId,
    });

    await prisma.recurringSubscription.update({
      where: { id: sub.id },
      data: {
        status: "ACTIVE",
        currentPeriodEnd: result.expiresAt ?? expiresAt,
      },
    });

    res.json({
      success: true,
      plan: "PREMIUM",
      subscriptionExpiresAt: result.expiresAt ?? expiresAt,
      recurring: true,
    });
  }
);

router.post(
  "/cancel-subscription",
  authMiddleware,
  async (req: Request, res: Response) => {
    const sub = await prisma.recurringSubscription.findFirst({
      where: {
        userId: req.user!.userId,
        status: { in: ["CREATED", "AUTHENTICATED", "ACTIVE", "PAUSED"] },
      },
      orderBy: { createdAt: "desc" },
    });
    if (!sub) {
      res.status(404).json({ error: "No active subscription" });
      return;
    }

    try {
      await razorpayRequest(
        "POST",
        `/subscriptions/${sub.providerSubscriptionId}/cancel`,
        { cancel_at_cycle_end: 1 }
      );
    } catch (err) {
      (req.log ?? logger).warn("razorpay.subscription.cancel.failed", {
        body: err instanceof RazorpayError ? err.body : String(err),
      });
    }

    await prisma.recurringSubscription.update({
      where: { id: sub.id },
      data: { cancelAtPeriodEnd: true },
    });

    res.json({ ok: true, cancelAtPeriodEnd: true });
  }
);

/** Razorpay webhook — mount with raw body in index.ts */
export async function handleSubscriptionWebhook(
  req: Request,
  res: Response
): Promise<void> {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers["x-razorpay-signature"];
  const raw =
    typeof (req as Request & { rawBody?: Buffer }).rawBody !== "undefined"
      ? (req as Request & { rawBody?: Buffer }).rawBody!
      : Buffer.from(JSON.stringify(req.body ?? {}));

  if (secret && typeof signature === "string") {
    const expected = crypto
      .createHmac("sha256", secret)
      .update(raw)
      .digest("hex");
    if (expected !== signature) {
      res.status(400).json({ error: "Invalid webhook signature" });
      return;
    }
  }

  const event = req.body as {
    event?: string;
    payload?: {
      subscription?: { entity?: RazorpaySubscription & { notes?: Record<string, string> } };
      payment?: { entity?: { id?: string; amount?: number } };
    };
  };

  const eventName = event.event ?? "";
  const subEntity = event.payload?.subscription?.entity;
  const paymentEntity = event.payload?.payment?.entity;

  if (!subEntity?.id) {
    res.json({ ok: true });
    return;
  }

  const local = await prisma.recurringSubscription.findUnique({
    where: { providerSubscriptionId: subEntity.id },
  });
  if (!local) {
    res.json({ ok: true });
    return;
  }

  if (
    eventName === "subscription.charged" ||
    eventName === "subscription.activated"
  ) {
    const planDays = resolvePlan(local.interval).planDays;
    if (paymentEntity?.id) {
      let payment = await prisma.payment.findFirst({
        where: { providerPaymentId: paymentEntity.id },
      });
      if (!payment) {
        payment = await prisma.payment.create({
          data: {
            userId: local.userId,
            providerOrderId: `sub_${subEntity.id}_${paymentEntity.id}`,
            providerPaymentId: paymentEntity.id,
            amount: paymentEntity.amount ?? local.amount,
            listAmount: paymentEntity.amount ?? local.amount,
            currency: "INR",
            planDays,
            billingInterval: local.interval,
            couponId: local.couponId,
            affiliateCode: local.affiliateCode,
            status: "PENDING",
          },
        });
      }
      await activatePremiumFromPayment({
        paymentId: payment.id,
        providerPaymentId: paymentEntity.id,
      });
    } else {
      await activatePremiumForUser({
        userId: local.userId,
        planDays,
        amountPaise: local.amount,
      });
    }

    const periodEnd = subEntity.current_end
      ? new Date(subEntity.current_end * 1000)
      : undefined;

    await prisma.recurringSubscription.update({
      where: { id: local.id },
      data: {
        status: mapRazorpayStatus(subEntity.status),
        ...(periodEnd ? { currentPeriodEnd: periodEnd } : {}),
      },
    });
  } else if (
    eventName === "subscription.cancelled" ||
    eventName === "subscription.completed" ||
    eventName === "subscription.halted"
  ) {
    await prisma.recurringSubscription.update({
      where: { id: local.id },
      data: { status: mapRazorpayStatus(subEntity.status) },
    });
  } else if (subEntity.status) {
    await prisma.recurringSubscription.update({
      where: { id: local.id },
      data: { status: mapRazorpayStatus(subEntity.status) },
    });
  }

  res.json({ ok: true });
}

export default router;
