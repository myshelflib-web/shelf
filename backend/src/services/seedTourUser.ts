import bcrypt from "bcryptjs";
import prisma from "../utils/prisma.js";
import { errorFields, logger } from "../utils/logger.js";

export const TOUR_SEED_EMAIL =
  process.env.TOUR_SEED_EMAIL ?? "tour@shelf.local";
export const TOUR_SEED_PASSWORD =
  process.env.TOUR_SEED_PASSWORD ?? "tour-tour-tour";
export const TOUR_SEED_NAME = process.env.TOUR_SEED_NAME ?? "Tour Tester";

/** Staging (or SEED_TOUR_USER=true) only — never production. */
export function shouldSeedTourUser(): boolean {
  if (process.env.SEED_TOUR_USER === "false") return false;
  if (process.env.SEED_TOUR_USER === "true") return true;
  return process.env.OTEL_DEPLOYMENT_ENVIRONMENT === "staging";
}

/** Upsert the dedicated product-tour test account. */
export async function ensureTourSeedUser(): Promise<{
  id: string;
  email: string;
} | null> {
  if (!shouldSeedTourUser()) return null;

  const passwordHash = await bcrypt.hash(TOUR_SEED_PASSWORD, 12);
  const user = await prisma.user.upsert({
    where: { email: TOUR_SEED_EMAIL },
    update: {
      passwordHash,
      name: TOUR_SEED_NAME,
      role: "STUDENT",
    },
    create: {
      email: TOUR_SEED_EMAIL,
      passwordHash,
      name: TOUR_SEED_NAME,
      role: "STUDENT",
    },
    select: { id: true, email: true },
  });

  logger.info("seed.tour_user.ok", {
    userId: user.id,
    email: user.email,
  });
  return user;
}

export async function ensureTourSeedUserSafe(): Promise<void> {
  try {
    await ensureTourSeedUser();
  } catch (err) {
    logger.warn("seed.tour_user.failed", errorFields(err));
  }
}
