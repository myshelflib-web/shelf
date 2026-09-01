import prisma from "../../utils/prisma.js";
import { slugify } from "../../utils/slugify.js";

export async function createIngestItemSlug(
  title: string,
  edition?: string | null
): Promise<string> {
  const base =
    slugify(edition ? `${title}-${edition}` : title) ||
    slugify(title) ||
    "item";
  let slug = base;
  let n = 1;
  while (
    await prisma.ingestItem.findUnique({ where: { slug }, select: { id: true } })
  ) {
    slug = `${base}-${n++}`;
  }
  return slug;
}
