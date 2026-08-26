import { Router, Request, Response } from "express";
import prisma from "../utils/prisma.js";
import { authMiddleware, adminMiddleware } from "../middleware/auth.js";
import { param } from "../utils/param.js";
import {
  normalizeCouponCode,
  parseCouponType,
  CouponError,
} from "../services/billing/coupons.js";

const router = Router();

router.use(authMiddleware, adminMiddleware);

router.get("/", async (_req: Request, res: Response) => {
  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
  });
  res.json({ coupons });
});

router.get("/affiliates/summary", async (_req: Request, res: Response) => {
  const profiles = await prisma.affiliateProfile.findMany({
    take: 100,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true, coinBalance: true } },
    },
  });

  const ids = profiles.map((p) => p.userId);
  const totals = await prisma.affiliateEarning.groupBy({
    by: ["affiliateUserId"],
    where: { affiliateUserId: { in: ids } },
    _sum: { amountCoins: true },
    _count: true,
  });
  const byUser = new Map(
    totals.map((t) => [
      t.affiliateUserId,
      { earned: t._sum.amountCoins ?? 0, count: t._count },
    ])
  );

  res.json({
    affiliates: profiles.map((p) => ({
      code: p.code,
      createdAt: p.createdAt,
      user: p.user,
      totalEarnedCoins: byUser.get(p.userId)?.earned ?? 0,
      referralCount: byUser.get(p.userId)?.count ?? 0,
    })),
  });
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const body = req.body as {
      code?: string;
      type?: string;
      value?: number;
      maxUses?: number | null;
      maxUsesPerUser?: number;
      validFrom?: string | null;
      validUntil?: string | null;
      active?: boolean;
      minAmount?: number | null;
    };

    if (!body.code?.trim()) {
      res.status(400).json({ error: "code required" });
      return;
    }
    const type = parseCouponType(body.type);
    const value = Number(body.value);
    if (!Number.isFinite(value) || value <= 0) {
      res.status(400).json({ error: "value must be a positive number" });
      return;
    }
    if (type === "PERCENT" && value > 100) {
      res.status(400).json({ error: "PERCENT value cannot exceed 100" });
      return;
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: normalizeCouponCode(body.code),
        type,
        value: Math.floor(value),
        maxUses:
          body.maxUses == null || body.maxUses === undefined
            ? null
            : Math.floor(Number(body.maxUses)),
        maxUsesPerUser:
          body.maxUsesPerUser == null
            ? 1
            : Math.max(0, Math.floor(Number(body.maxUsesPerUser))),
        validFrom: body.validFrom ? new Date(body.validFrom) : null,
        validUntil: body.validUntil ? new Date(body.validUntil) : null,
        active: body.active !== false,
        minAmount:
          body.minAmount == null || body.minAmount === undefined
            ? null
            : Math.floor(Number(body.minAmount)),
      },
    });
    res.status(201).json({ coupon });
  } catch (err) {
    if (err instanceof CouponError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code: string }).code === "P2002"
    ) {
      res.status(409).json({ error: "Coupon code already exists" });
      return;
    }
    throw err;
  }
});

router.patch("/:id", async (req: Request, res: Response) => {
  const id = param(req, "id");
  const body = req.body as {
    type?: string;
    value?: number;
    maxUses?: number | null;
    maxUsesPerUser?: number;
    validFrom?: string | null;
    validUntil?: string | null;
    active?: boolean;
    minAmount?: number | null;
  };

  const data: Record<string, unknown> = {};
  if (body.type !== undefined) data.type = parseCouponType(body.type);
  if (body.value !== undefined) {
    const value = Math.floor(Number(body.value));
    if (!Number.isFinite(value) || value <= 0) {
      res.status(400).json({ error: "value must be a positive number" });
      return;
    }
    data.value = value;
  }
  if (body.maxUses !== undefined) {
    data.maxUses =
      body.maxUses == null ? null : Math.floor(Number(body.maxUses));
  }
  if (body.maxUsesPerUser !== undefined) {
    data.maxUsesPerUser = Math.max(0, Math.floor(Number(body.maxUsesPerUser)));
  }
  if (body.validFrom !== undefined) {
    data.validFrom = body.validFrom ? new Date(body.validFrom) : null;
  }
  if (body.validUntil !== undefined) {
    data.validUntil = body.validUntil ? new Date(body.validUntil) : null;
  }
  if (body.active !== undefined) data.active = Boolean(body.active);
  if (body.minAmount !== undefined) {
    data.minAmount =
      body.minAmount == null ? null : Math.floor(Number(body.minAmount));
  }

  try {
    const coupon = await prisma.coupon.update({ where: { id }, data });
    res.json({ coupon });
  } catch (err) {
    if (err instanceof CouponError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    res.status(404).json({ error: "Coupon not found" });
  }
});

router.delete("/:id", async (req: Request, res: Response) => {
  const id = param(req, "id");
  try {
    await prisma.coupon.update({
      where: { id },
      data: { active: false },
    });
    res.json({ ok: true });
  } catch {
    res.status(404).json({ error: "Coupon not found" });
  }
});

export default router;
