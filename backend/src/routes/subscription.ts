import { Router, Request, Response } from "express";
import crypto from "crypto";
import prisma from "../utils/prisma.js";
import { authMiddleware } from "../middleware/auth.js";
import { isPremiumUser } from "../utils/paywall.js";
import { logger } from "../utils/logger.js";
import { metrics } from "../utils/metrics.js";
import { billingFlow, reqLog } from "../utils/flowLog.js";
import { getBillingPlans, resolvePlan } from "../services/billing/plans.js";
import { findValidCoupon, CouponError } from "../services/billing/coupons.js";
import { priceOrder, MIN_CHARGE_PAISE } from "../services/billing/pricing.js";
import {
  razorpayConfigured,
  razorpayKeyId,
  razorpayRequest,
  RazorpayError,
  type RazorpayOrder,
} from "../services/billing/razorpay.js";
import { activatePremiumFromPayment } from "../services/billing/activate.js";
import { toUserFacingError } from "../utils/userFacingError.js";
import {
  FREE_LLM_TOKENS,
  FREE_STORAGE_BYTES,
  PREMIUM_LLM_TOKENS,
  PREMIUM_STORAGE_BYTES,
} from "../utils/quotas.js";

const router = Router();

router.get("/status", authMiddleware, async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: {
      id: true,
      plan: true,
      role: true,
      subscriptionExpiresAt: true,
      coinBalance: true,
    },
  });

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const plans = getBillingPlans();
  const recurring = await prisma.recurringSubscription.findFirst({
    where: {
      userId: user.id,
      status: { in: ["CREATED", "AUTHENTICATED", "ACTIVE", "PAUSED"] },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      interval: true,
      status: true,
      amount: true,
      currentPeriodEnd: true,
      cancelAtPeriodEnd: true,
      providerSubscriptionId: true,
    },
  });

  res.json({
    plan: user.plan,
    isPremium: isPremiumUser(user),
    subscriptionExpiresAt: user.subscriptionExpiresAt,
    coinBalance: user.coinBalance,
    priceInr: plans.ONCE.amountPaise / 100,
    planDays: plans.ONCE.planDays,
    plans: {
      once: {
        amountPaise: plans.ONCE.amountPaise,
        priceInr: plans.ONCE.amountPaise / 100,
        planDays: plans.ONCE.planDays,
        label: plans.ONCE.label,
      },
      monthly: {
        amountPaise: plans.MONTHLY.amountPaise,
        priceInr: plans.MONTHLY.amountPaise / 100,
        planDays: plans.MONTHLY.planDays,
        label: plans.MONTHLY.label,
      },
      yearly: {
        amountPaise: plans.YEARLY.amountPaise,
        priceInr: plans.YEARLY.amountPaise / 100,
        planDays: plans.YEARLY.planDays,
        label: plans.YEARLY.label,
      },
    },
    recurring,
    freeStorageMb: Math.round(FREE_STORAGE_BYTES / (1024 * 1024)),
    premiumStorageGb: Math.round(PREMIUM_STORAGE_BYTES / (1024 * 1024 * 1024)),
    freeLlmTokens: FREE_LLM_TOKENS,
    premiumLlmTokens: PREMIUM_LLM_TOKENS,
  });
});

router.post("/preview", authMiddleware, async (req: Request, res: Response) => {
  const interval = typeof req.body?.interval === "string" ? req.body.interval : "ONCE";
  const couponCode =
    typeof req.body?.couponCode === "string" ? req.body.couponCode : undefined;
  const applyCoins = req.body?.applyCoins !== false;
  const plan = resolvePlan(interval);

  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { coinBalance: true },
  });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  try {
    let coupon = null;
    let couponDiscount = 0;
    if (couponCode?.trim()) {
      const found = await findValidCoupon(
        couponCode,
        req.user!.userId,
        plan.amountPaise
      );
      coupon = found.coupon;
      couponDiscount = found.discount;
    }
    const priced = priceOrder({
      listAmount: plan.amountPaise,
      coupon,
      coinBalance: user.coinBalance,
      applyCoins,
    });
    res.json({
      interval: plan.interval,
      planDays: plan.planDays,
      label: plan.label,
      ...priced,
      couponCode: coupon?.code ?? null,
      couponDiscount,
      coinBalance: user.coinBalance,
    });
  } catch (err) {
    if (err instanceof CouponError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    throw err;
  }
});

router.post("/create-order", authMiddleware, async (req: Request, res: Response) => {
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
    typeof req.body?.interval === "string" ? req.body.interval : "ONCE";
  if (intervalRaw.toUpperCase() === "MONTHLY" || intervalRaw.toUpperCase() === "YEARLY") {
    res.status(400).json({
      error: "Use /api/subscription/create-subscription for monthly or yearly UPI Autopay.",
    });
    return;
  }

  const plan = resolvePlan("ONCE");
  const couponCode =
    typeof req.body?.couponCode === "string" ? req.body.couponCode : undefined;
  const affiliateCode =
    typeof req.body?.affiliateCode === "string"
      ? req.body.affiliateCode.trim().toUpperCase() || null
      : null;
  const applyCoins = req.body?.applyCoins !== false;

  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: {
      id: true,
      email: true,
      name: true,
      plan: true,
      subscriptionExpiresAt: true,
      role: true,
      coinBalance: true,
    },
  });

  if (!user) {
    res.status(404).json({ error: "User not found" });
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

    const priced = priceOrder({
      listAmount: plan.amountPaise,
      coupon,
      coinBalance: user.coinBalance,
      applyCoins,
    });

    // Fully covered by coupon and/or coins — activate without Razorpay.
    if (priced.chargeAmount === 0) {
      const payment = await prisma.payment.create({
        data: {
          userId: user.id,
          providerOrderId: `credit_${user.id.slice(0, 8)}_${Date.now()}`,
          amount: 0,
          listAmount: priced.listAmount,
          currency: "INR",
          planDays: plan.planDays,
          billingInterval: "ONCE",
          couponId: coupon?.id,
          affiliateCode,
          coinsApplied: priced.coinsApplied,
          status: "PENDING",
        },
      });

      const result = await activatePremiumFromPayment({
        paymentId: payment.id,
        providerPaymentId: `credit_${payment.id}`,
      });

      billingFlow.checkoutOk(reqLog(req), {
        userId: user.id,
        freeActivation: true,
        coinsApplied: priced.coinsApplied,
      });

      res.json({
        freeActivation: true,
        success: true,
        plan: "PREMIUM",
        subscriptionExpiresAt: result.expiresAt,
        amount: 0,
        coinsApplied: priced.coinsApplied,
        couponDiscount: priced.couponDiscount,
      });
      return;
    }

    if (priced.chargeAmount < MIN_CHARGE_PAISE) {
      res.status(400).json({
        error: "Payable amount is below the minimum charge. Adjust coins or coupon.",
      });
      return;
    }

    const receipt = `shelf_${user.id.slice(0, 8)}_${Date.now()}`;
    let order: RazorpayOrder;
    try {
      order = await razorpayRequest<RazorpayOrder>("POST", "/orders", {
        amount: priced.chargeAmount,
        currency: "INR",
        receipt,
        notes: {
          userId: user.id,
          plan: "PREMIUM",
          coupon: coupon?.code ?? "",
          affiliate: affiliateCode ?? "",
        },
      });
    } catch (err) {
      metrics.inc("razorpay_orders_total", { ok: false });
      (req.log ?? logger).error("razorpay.order.failed", {
        body: err instanceof RazorpayError ? err.body : String(err),
      });
      res.status(502).json({ error: "Failed to create payment order" });
      return;
    }

    await prisma.payment.create({
      data: {
        userId: user.id,
        providerOrderId: order.id,
        amount: order.amount,
        listAmount: priced.listAmount,
        currency: order.currency,
        planDays: plan.planDays,
        billingInterval: "ONCE",
        couponId: coupon?.id,
        affiliateCode,
        coinsApplied: priced.coinsApplied,
      },
    });

    metrics.inc("razorpay_orders_total", { ok: true });
    billingFlow.checkoutStart(reqLog(req), {
      userId: user.id,
      orderId: order.id,
      amountPaise: order.amount,
    });
    (req.log ?? logger).info("razorpay.order.created", {
      orderId: order.id,
      userId: user.id,
      amount: order.amount,
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: razorpayKeyId(),
      name: "Shelf Premium",
      description: `${plan.planDays}-day Premium access`,
      prefill: { name: user.name, email: user.email },
      listAmount: priced.listAmount,
      couponDiscount: priced.couponDiscount,
      coinsApplied: priced.coinsApplied,
      freeActivation: false,
    });
  } catch (err) {
    if (err instanceof CouponError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    throw err;
  }
});

router.post("/verify", authMiddleware, async (req: Request, res: Response) => {
  const { orderId, paymentId, signature } = req.body as {
    orderId?: string;
    paymentId?: string;
    signature?: string;
  };
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!orderId || !paymentId || !signature || !keySecret) {
    res.status(400).json({ error: "orderId, paymentId, and signature required" });
    return;
  }

  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  if (expected !== signature) {
    res.status(400).json({ error: "Invalid payment signature" });
    return;
  }

  const payment = await prisma.payment.findUnique({
    where: { providerOrderId: orderId },
  });

  if (!payment || payment.userId !== req.user!.userId) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  const result = await activatePremiumFromPayment({
    paymentId: payment.id,
    providerPaymentId: paymentId,
  });

  res.json({
    success: true,
    plan: "PREMIUM",
    subscriptionExpiresAt: result.expiresAt,
    alreadyActivated: result.alreadyActivated,
  });
});

export default router;
