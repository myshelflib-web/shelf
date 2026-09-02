type FolderRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string;
  order: number;
  parentId: string | null;
};

/**
 * When listing paginated root folders, include their nested children so
 * legacy clients still receive topicGroups + pages under those folders.
 */
export function foldersForLegacySubjectIds<T extends FolderRow>(
  folders: T[],
  ids?: string[]
): T[] {
  if (!ids || ids.length === 0) return folders;

  const byId = new Map(folders.map((f) => [f.id, f]));
  const include = new Set<string>();

  for (const id of ids) {
    include.add(id);
  }

  let grew = true;
  while (grew) {
    grew = false;
    for (const f of folders) {
      if (f.parentId && include.has(f.parentId) && !include.has(f.id)) {
        include.add(f.id);
        grew = true;
      }
    }
  }

  return [...include]
    .map((id) => byId.get(id))
    .filter((f): f is T => Boolean(f));
}
