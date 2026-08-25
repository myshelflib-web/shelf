import { Request, Response, NextFunction } from "express";
import prisma from "../utils/prisma.js";
import { isPremiumUser } from "../utils/paywall.js";

export async function premiumMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.userId },
    select: { plan: true, role: true, subscriptionExpiresAt: true },
  });

  if (!user || !isPremiumUser(user)) {
    res.status(403).json({
      error: "Premium subscription required for My Content",
      upgradeUrl: "/subscribe",
    });
    return;
  }

  next();
}
