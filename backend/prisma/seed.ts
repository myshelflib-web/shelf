import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import "dotenv/config";

const prisma = new PrismaClient();

/**
 * Seed local/staging accounts.
 * Curriculum / Preloaded packs are uploaded via admin (or a bulk import script) —
 * do not invent placeholder UPSC subjects here.
 */
async function main() {
  const adminHash = await bcrypt.hash("admin123", 12);
  const tourHash = await bcrypt.hash(
    process.env.TOUR_SEED_PASSWORD ?? "tour-tour-tour",
    12
  );
  const tourEmail = process.env.TOUR_SEED_EMAIL ?? "tour@shelf.local";
  const tourName = process.env.TOUR_SEED_NAME ?? "Tour Tester";

  await prisma.user.upsert({
    where: { email: "admin@shelf.local" },
    update: {
      passwordHash: adminHash,
      name: "Admin",
      role: "ADMIN",
    },
    create: {
      email: "admin@shelf.local",
      passwordHash: adminHash,
      name: "Admin",
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: tourEmail },
    update: {
      passwordHash: tourHash,
      name: tourName,
      role: "STUDENT",
    },
    create: {
      email: tourEmail,
      passwordHash: tourHash,
      name: tourName,
      role: "STUDENT",
    },
  });

  console.log("Seed complete:");
  console.log("  admin@shelf.local / admin123 (ADMIN)");
  console.log(`  ${tourEmail} / ${process.env.TOUR_SEED_PASSWORD ?? "tour-tour-tour"} (STUDENT, product tour)`);
  console.log(
    "No curriculum subjects seeded — use docs/UPSC_BACKFILL.csv + admin upload."
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
