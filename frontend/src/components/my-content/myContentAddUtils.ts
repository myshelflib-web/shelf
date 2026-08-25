import type { DragEvent } from "react";

export function titleFromFile(file: File): string {
  return file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim() || file.name;
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
