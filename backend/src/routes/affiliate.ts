import { Router, Request, Response } from "express";
import prisma from "../utils/prisma.js";
import { authMiddleware } from "../middleware/auth.js";
import { ensureAffiliateProfile } from "../services/billing/affiliates.js";
import {
  affiliateCommissionBps,
  affiliateCookieDays,
} from "../services/billing/plans.js";

const router = Router();

router.get("/me", authMiddleware, async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const profile = await ensureAffiliateProfile(userId);
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { coinBalance: true },
  });

  const earnings = await prisma.affiliateEarning.findMany({
    where: { affiliateUserId: userId },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      amountCoins: true,
      createdAt: true,
      referred: { select: { name: true } },
    },
  });

  const totals = await prisma.affiliateEarning.aggregate({
    where: { affiliateUserId: userId },
    _sum: { amountCoins: true },
    _count: true,
  });

  res.json({
    code: profile.code,
    coinBalance: user?.coinBalance ?? 0,
    commissionPercent: affiliateCommissionBps() / 100,
    attributionDays: affiliateCookieDays(),
    totalEarnedCoins: totals._sum.amountCoins ?? 0,
    referralCount: totals._count,
    recent: earnings.map((e) => ({
      id: e.id,
      amountCoins: e.amountCoins,
      createdAt: e.createdAt,
      referredName: e.referred.name,
    })),
  });
});

router.get(
  "/resolve/:code",
  authMiddleware,
  async (req: Request, res: Response) => {
    const code = String(req.params.code ?? "")
      .trim()
      .toUpperCase();
    if (!code) {
      res.status(400).json({ error: "code required" });
      return;
    }
    const profile = await prisma.affiliateProfile.findUnique({
      where: { code },
      select: { code: true, userId: true },
    });
    if (!profile) {
      res.status(404).json({ error: "Unknown affiliate code" });
      return;
    }
    if (profile.userId === req.user!.userId) {
      res.status(400).json({ error: "You cannot use your own affiliate link" });
      return;
    }
    res.json({ code: profile.code, valid: true });
  }
);

export default router;
