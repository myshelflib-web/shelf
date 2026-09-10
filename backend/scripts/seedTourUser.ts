/**
 * Upsert a dedicated account for replaying the product spotlight tour.
 *
 * Usage:
 *   npm run seed:tour-user --prefix backend
 *   DATABASE_URL="postgresql://…staging…" npm run seed:tour-user --prefix backend
 *
 * Login: tour@shelf.local / tour-tour-tour
 * Then: Settings → Replay tour, or visit /my-content?tour=1
 *
 * On staging Render, the backend also upserts this user on boot when
 * OTEL_DEPLOYMENT_ENVIRONMENT=staging.
 */
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import "dotenv/config";

const prisma = new PrismaClient();

const EMAIL = process.env.TOUR_SEED_EMAIL ?? "tour@shelf.local";
const PASSWORD = process.env.TOUR_SEED_PASSWORD ?? "tour-tour-tour";
const NAME = process.env.TOUR_SEED_NAME ?? "Tour Tester";

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 12);

  const user = await prisma.user.upsert({
    where: { email: EMAIL },
    update: {
      passwordHash,
      name: NAME,
      role: "STUDENT",
    },
    create: {
      email: EMAIL,
      passwordHash,
      name: NAME,
      role: "STUDENT",
    },
  });

  console.log("Tour seed user ready:");
  console.log(`  email:    ${EMAIL}`);
  console.log(`  password: ${PASSWORD}`);
  console.log(`  userId:   ${user.id}`);
  console.log("");
  console.log("Replay tips without signing up again:");
  console.log("  • Settings → Product tour → Replay tour");
  console.log("  • Or open /my-content?tour=1 (current surface) / ?tour=all");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
