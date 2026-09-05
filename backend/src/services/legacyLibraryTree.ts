import type { Prisma } from "@prisma/client";

const fileSelect = {
  id: true,
  title: true,
  slug: true,
  status: true,
  order: true,
  completed: true,
  starred: true,
  contentType: true,
} as const;

export type LegacyPageSummary = Prisma.UserTopicGetPayload<{
  select: typeof fileSelect;
}>;

export type LegacyTopicGroup = {
  id: string;
  title: string;
  slug: string;
  order: number;
  pages: LegacyPageSummary[];
  /** Nested folders under this folder (depth 3+). */
  children?: LegacyTopicGroup[];
};

/** Legacy collection shape with recursive nested folders. */
export type LegacySubject = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string;
  order: number;
  topicGroups: LegacyTopicGroup[];
  pages: LegacyPageSummary[];
};

type FolderRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string;
  order: number;
  parentId: string | null;
};

type FileRow = LegacyPageSummary & { folderId: string | null };

/** Build subject tree from unified folders + files (arbitrary nesting). */
export function buildLegacySubjectTree(
  folders: FolderRow[],
  files: FileRow[]
): LegacySubject[] {
  const roots = folders
    .filter((f) => !f.parentId)
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));

  const childrenByParent = new Map<string, FolderRow[]>();
  for (const f of folders) {
    if (!f.parentId) continue;
    const list = childrenByParent.get(f.parentId) ?? [];
    list.push(f);
    childrenByParent.set(f.parentId, list);
  }
  for (const [, list] of childrenByParent) {
    list.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
  }

  const filesByFolder = new Map<string | null, FileRow[]>();
  for (const file of files) {
    const key = file.folderId;
    const list = filesByFolder.get(key) ?? [];
    list.push(file);
    filesByFolder.set(key, list);
  }
  for (const [, list] of filesByFolder) {
    list.sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
  }

  function buildGroup(folder: FolderRow): LegacyTopicGroup {
    const nested = childrenByParent.get(folder.id) ?? [];
    return {
      id: folder.id,
      title: folder.name,
      slug: folder.slug,
      order: folder.order,
      pages: (filesByFolder.get(folder.id) ?? []).map(stripFolderId),
      children: nested.length > 0 ? nested.map(buildGroup) : undefined,
    };
  }

  return roots.map((root) => {
    const childFolders = childrenByParent.get(root.id) ?? [];
    return {
      id: root.id,
      name: root.name,
      slug: root.slug,
      description: root.description,
      icon: root.icon,
      order: root.order,
      topicGroups: childFolders.map(buildGroup),
      pages: (filesByFolder.get(root.id) ?? []).map(stripFolderId),
    };
  });
}

/**
 * Re-apply browse/sort order after the tree builder (which sorts roots by
 * manual `order`). Nested folders stay order-sorted inside each collection.
 */
export function orderSubjectsByIds(
  subjects: LegacySubject[],
  ids?: string[]
): LegacySubject[] {
  if (!ids || ids.length === 0) return subjects;
  const byId = new Map(subjects.map((s) => [s.id, s]));
  const ordered: LegacySubject[] = [];
  for (const id of ids) {
    const subject = byId.get(id);
    if (subject) ordered.push(subject);
  }
  return ordered;
}

function stripFolderId(file: FileRow): LegacyPageSummary {
  const { folderId: _f, ...rest } = file as FileRow & { folderId?: string | null };
  return rest;
}

export { fileSelect };
