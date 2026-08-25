import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import "dotenv/config";

const prisma = new PrismaClient();

/**
 * Seed only the local admin account.
 * Curriculum / Preloaded packs are uploaded via admin (or a bulk import script) —
 * do not invent placeholder UPSC subjects here.
 */
async function main() {
  const passwordHash = await bcrypt.hash("admin123", 12);

  await prisma.user.upsert({
    where: { email: "admin@shelf.local" },
    update: {},
    create: {
      email: "admin@shelf.local",
      passwordHash,
      name: "Admin",
      role: "ADMIN",
    },
  });

  console.log("Seed complete: admin@shelf.local / admin123");
  console.log(
    "No curriculum subjects seeded — use docs/UPSC_BACKFILL.csv + admin upload."
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
