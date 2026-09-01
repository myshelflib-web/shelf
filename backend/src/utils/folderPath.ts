import prisma from "./prisma.js";

export type FolderBreadcrumb = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
};

/** Walk up from a folder to root (root first). */
export async function folderAncestors(
  folderId: string
): Promise<FolderBreadcrumb[]> {
  const chain: FolderBreadcrumb[] = [];
  let currentId: string | null = folderId;
  const seen = new Set<string>();
  while (currentId) {
    if (seen.has(currentId)) break;
    seen.add(currentId);
    const row: FolderBreadcrumb | null = await prisma.userFolder.findUnique({
      where: { id: currentId },
      select: { id: true, name: true, slug: true, parentId: true },
    });
    if (!row) break;
    chain.unshift(row);
    currentId = row.parentId;
  }
  return chain;
}

/** Slugs for S3 keys and reader URLs (supports arbitrary depth; legacy uses first two). */
export function folderSlugPath(chain: FolderBreadcrumb[]): string[] {
  return chain.map((f) => f.slug);
}

export async function folderSlugPathById(folderId: string): Promise<string[]> {
  return folderSlugPath(await folderAncestors(folderId));
}
