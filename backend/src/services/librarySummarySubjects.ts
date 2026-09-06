import prisma from "../utils/prisma.js";
import {
  orderSubjectsByIds,
  type LegacySubject,
} from "./legacyLibraryTree.js";
import { ensureLegacyLibraryMapped } from "./legacyLibraryMap.js";

/**
 * Folder shells for browse lists — no nested topics/pages.
 * Clients hydrate the tree via GET /subjects/slug/:slug on expand.
 */
export async function summarySubjectsForIds(
  userId: string,
  ids: string[]
): Promise<LegacySubject[]> {
  if (ids.length === 0) return [];
  await ensureLegacyLibraryMapped(userId);

  const folders = await prisma.userFolder.findMany({
    where: { userId, parentId: null, id: { in: ids } },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      icon: true,
      order: true,
    },
  });

  const stubs: LegacySubject[] = folders.map((f) => ({
    id: f.id,
    name: f.name,
    slug: f.slug,
    description: f.description,
    icon: f.icon,
    order: f.order,
    topicGroups: [],
    pages: [],
  }));

  return orderSubjectsByIds(stubs, ids);
}

/** `tree=1` or a search query needs nested pages; otherwise return stubs. */
export function listSubjectsIncludeTree(query: {
  tree?: unknown;
  q?: string;
}): boolean {
  if (String(query.tree ?? "") === "1") return true;
  return Boolean(String(query.q ?? "").trim());
}
