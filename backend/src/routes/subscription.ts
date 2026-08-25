import { Router, Request, Response } from "express";
import crypto from "crypto";
import prisma from "../utils/prisma.js";
import { authMiddleware } from "../middleware/auth.js";
import {
  sendEmailInBackground,
  subscriptionThankYouEmail,
} from "../services/email/index.js";
import { isPremiumUser } from "../utils/paywall.js";
import { logger } from "../utils/logger.js";
import { metrics } from "../utils/metrics.js";

const router = Router();

const PLAN_AMOUNT = parseInt(process.env.SUBSCRIPTION_AMOUNT_PAISE ?? "99900", 10);
const PLAN_DAYS = parseInt(process.env.SUBSCRIPTION_DAYS ?? "365", 10);

router.get("/status", authMiddleware, async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: {
      plan: true,
      role: true,
      subscriptionExpiresAt: true,
    },
  });

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({
    plan: user.plan,
    isPremium: isPremiumUser(user),
    subscriptionExpiresAt: user.subscriptionExpiresAt,
    priceInr: PLAN_AMOUNT / 100,
    planDays: PLAN_DAYS,
    freeStorageMb: 250,
    premiumStorageGb: 10,
    freeLlmTokens: 50_000,
    premiumLlmTokens: 2_000_000,
  });
});

router.post("/create-order", authMiddleware, async (req: Request, res: Response) => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    res.status(503).json({
      error: "Payments not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.",
    });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { id: true, email: true, name: true, plan: true, subscriptionExpiresAt: true, role: true },
  });

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  if (isPremiumUser(user)) {
    res.status(400).json({ error: "You already have an active premium subscription" });
    return;
  }

  const receipt = `shelf_${user.id.slice(0, 8)}_${Date.now()}`;

  const orderRes = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
    },
    body: JSON.stringify({
      amount: PLAN_AMOUNT,
      currency: "INR",
      receipt,
      notes: { userId: user.id, plan: "PREMIUM" },
    }),
  });

  if (!orderRes.ok) {
    const err = await orderRes.text();
    metrics.inc("razorpay_orders_total", { ok: false });
    (req.log ?? logger).error("razorpay.order.failed", { body: err });
    res.status(502).json({ error: "Failed to create payment order" });
    return;
  }

  const order = (await orderRes.json()) as { id: string; amount: number; currency: string };

  await prisma.payment.create({
    data: {
      userId: user.id,
      providerOrderId: order.id,
      amount: order.amount,
      currency: order.currency,
      planDays: PLAN_DAYS,
    },
  });

  metrics.inc("razorpay_orders_total", { ok: true });
  (req.log ?? logger).info("razorpay.order.created", {
    orderId: order.id,
    userId: user.id,
    amount: order.amount,
  });

  res.json({
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId,
    name: "Shelf Premium",
    description: `${PLAN_DAYS}-day full access to all premium articles`,
    prefill: { name: user.name, email: user.email },
  });
});

router.post("/verify", authMiddleware, async (req: Request, res: Response) => {
  const { orderId, paymentId, signature } = req.body;
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

  if (payment.status === "COMPLETED") {
    res.json({ success: true, message: "Already activated" });
    return;
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + payment.planDays);

  const [, updatedUser] = await prisma.$transaction([
    prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "COMPLETED",
        providerPaymentId: paymentId,
        completedAt: new Date(),
      },
    }),
    prisma.user.update({
      where: { id: payment.userId },
      data: {
        plan: "PREMIUM",
        subscriptionExpiresAt: expiresAt,
      },
      select: { email: true, name: true },
    }),
  ]);

  sendEmailInBackground({
    to: updatedUser.email,
    ...subscriptionThankYouEmail(
      updatedUser.name,
      expiresAt,
      payment.planDays,
      payment.amount
    ),
  });

  res.json({
    success: true,
    plan: "PREMIUM",
    subscriptionExpiresAt: expiresAt,
  });
});

export default router;
