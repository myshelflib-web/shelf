import type { DragEvent } from "react";

const UPLOADABLE_EXT = /\.(pdf|txt|md|markdown|docx)$/i;

export function isUploadableFile(file: File): boolean {
  return UPLOADABLE_EXT.test(file.name);
}

export function titleFromFile(file: File): string {
  return file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim() || file.name;
}

export type BulkFolderGroup = {
  /** null = pages sit directly on the collection (no topic) */
  topicTitle: string | null;
  files: File[];
};

function relativePath(file: File): string {
  const rel = (file as File & { webkitRelativePath?: string }).webkitRelativePath;
  return rel?.trim() || file.name;
}

/** First folder segment under the selection → topic; root files → collection-level. */
export function groupFilesForBulkUpload(files: File[]): BulkFolderGroup[] {
  const map = new Map<string, File[]>();

  for (const file of files) {
    if (!isUploadableFile(file)) continue;
    const parts = relativePath(file).split("/").filter(Boolean);
    const topicTitle = parts.length >= 2 ? parts[0] : null;
    const key = topicTitle ?? "__collection__";
    const list = map.get(key) ?? [];
    list.push(file);
    map.set(key, list);
  }

  return [...map.entries()]
    .map(([key, groupedFiles]) => ({
      topicTitle: key === "__collection__" ? null : key,
      files: groupedFiles,
    }))
    .sort((a, b) =>
      (a.topicTitle ?? "").localeCompare(b.topicTitle ?? "", undefined, {
        sensitivity: "base",
      })
    );
}

export function pickDroppedFiles(list: FileList | null): File[] {
  if (!list?.length) return [];
  return Array.from(list).filter(isUploadableFile);
}

export function isFolderDrop(list: FileList | null): boolean {
  if (!list || list.length <= 1) return false;
  return Array.from(list).some((f) => relativePath(f).includes("/"));
}

export function isFileDrag(e: DragEvent): boolean {
  return Array.from(e.dataTransfer.types).includes("Files");
}

export function pickDroppedFile(list: FileList | null): File | null {
  if (!list?.length) return null;
  for (const f of Array.from(list)) {
    if (/\.(pdf|txt|md|markdown|docx)$/i.test(f.name)) return f;
  }
  return list[0] ?? null;
}

export function addContextFromPath(pathname: string): {
  notebookSlug?: string;
  topicSlug?: string;
} {
  const parts = pathname.replace(/^\/my-content\/?/, "").split("/").filter(Boolean);
  if (parts.length === 0 || parts[0] === "file") return {};
  if (parts[1] === "file") return { notebookSlug: parts[0] };
  if (parts.length >= 2) {
    return { notebookSlug: parts[0], topicSlug: parts[1] };
  }
  return { notebookSlug: parts[0] };
}
