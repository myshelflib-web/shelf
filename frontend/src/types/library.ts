import type { UserContentType, UserPageSummary } from "@/types";

/** Unified folder node (any depth). */
export interface LibraryFolder {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string;
  order: number;
}

/** Library file — same payload as UserPageSummary with folderId. */
export interface LibraryFile extends UserPageSummary {
  folderId?: string | null;
  contentType?: UserContentType;
}

export interface LibraryTreeResponse {
  folders: LibraryFolder[];
  files: LibraryFile[];
  rootFiles: LibraryFile[];
}

/** @deprecated Legacy alias — use LibraryFolder */
export type UserFolder = LibraryFolder;

/** @deprecated Legacy alias — use LibraryFile */
export type UserFile = LibraryFile;
