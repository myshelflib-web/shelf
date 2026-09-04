import prisma from "./prisma.js";
import { FolderDepthError, MAX_FOLDER_DEPTH } from "./folderDepth.js";

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

/** True when `folderId` is the root or a descendant of `rootId`. */
export async function folderIsUnderRoot(
  folderId: string,
  rootId: string
): Promise<boolean> {
  const chain = await folderAncestors(folderId);
  return chain[0]?.id === rootId;
}

/** Depth of a new child under `parentId` (parent depth + 1). */
export async function nextFolderDepth(parentId: string): Promise<number> {
  const chain = await folderAncestors(parentId);
  return chain.length + 1;
}

export async function assertCanNestUnder(parentId: string): Promise<void> {
  const depth = await nextFolderDepth(parentId);
  if (depth > MAX_FOLDER_DEPTH) {
    throw new FolderDepthError(
      `Folders can be nested up to ${MAX_FOLDER_DEPTH} levels`
    );
  }
}

/** Slugs for S3 keys and reader URLs (supports arbitrary depth; legacy uses first two). */
export function folderSlugPath(chain: FolderBreadcrumb[]): string[] {
  return chain.map((f) => f.slug);
}

export async function folderSlugPathById(folderId: string): Promise<string[]> {
  return folderSlugPath(await folderAncestors(folderId));
}
