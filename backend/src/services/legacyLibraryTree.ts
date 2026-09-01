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
};

/** Legacy collection shape (2-level folder tree for existing clients). */
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

/** Build legacy 2-level tree from unified folders + files. */
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

  return roots.map((root) => {
    const childFolders = childrenByParent.get(root.id) ?? [];
    const topicGroups: LegacyTopicGroup[] = childFolders.map((child) => ({
      id: child.id,
      title: child.name,
      slug: child.slug,
      order: child.order,
      pages: (filesByFolder.get(child.id) ?? []).map(stripFolderId),
    }));

    return {
      id: root.id,
      name: root.name,
      slug: root.slug,
      description: root.description,
      icon: root.icon,
      order: root.order,
      topicGroups,
      pages: (filesByFolder.get(root.id) ?? []).map(stripFolderId),
    };
  });
}

function stripFolderId(file: FileRow): LegacyPageSummary {
  const { folderId: _f, ...rest } = file as FileRow & { folderId?: string | null };
  return rest;
}

export { fileSelect };
