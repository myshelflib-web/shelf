import type { ReactNode } from "react";
import { FolderUp, PenLine, FileText, Upload, Youtube } from "lucide-react";
import type { UploadProgress } from "@/lib/api";

export type PageAddMode = "file" | "bulk" | "sketch" | "doc" | "link" | "youtube";

export function formatAddBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export const PAGE_ADD_MODES: ReadonlyArray<readonly [PageAddMode, string]> = [
  ["file", "Upload"],
  ["bulk", "Folders"],
  ["youtube", "YouTube"],
  ["link", "Link"],
  ["sketch", "Notebook"],
  ["doc", "Doc"],
];

export function pageAddSubmitLabel(
  addMode: PageAddMode,
  submitting: boolean,
  uploadProgress: UploadProgress | null
): ReactNode {
  if (submitting && addMode === "bulk") return "Importing…";
  if (submitting && addMode === "file") {
    if (uploadProgress?.phase === "compressing") return "Compressing…";
    if (uploadProgress && uploadProgress.percent < 100) {
      return `Uploading ${uploadProgress.percent}%`;
    }
    return "Saving…";
  }
  if (submitting && (addMode === "link" || addMode === "youtube")) return "Adding…";
  if (submitting) return "Creating…";
  if (addMode === "youtube") {
    return (
      <>
        <Youtube className="w-4 h-4" />
        Add YouTube
      </>
    );
  }
  if (addMode === "link") return "Add link";
  if (addMode === "bulk") {
    return (
      <>
        <FolderUp className="w-4 h-4" />
        Import folders
      </>
    );
  }
  if (addMode === "file") {
    return (
      <>
        <Upload className="w-4 h-4" />
        Upload
      </>
    );
  }
  if (addMode === "sketch") {
    return (
      <>
        <PenLine className="w-4 h-4" />
        Create notebook
      </>
    );
  }
  return (
    <>
      <FileText className="w-4 h-4" />
      Create doc
    </>
  );
}

export function AddUploadProgressBar({ progress }: { progress: UploadProgress }) {
  const compressing = progress.phase === "compressing";
  const saving = !compressing && progress.percent >= 100;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3 text-xs text-[var(--text-muted)]">
        <span>
          {compressing
            ? "Compressing…"
            : saving
              ? "Saving to library…"
              : "Uploading"}
        </span>
        <span className="tabular-nums text-[var(--text-secondary)]">
          {compressing
            ? "Preparing file"
            : saving
              ? "100%"
              : progress.total > 0
                ? `${formatAddBytes(progress.loaded)} of ${formatAddBytes(progress.total)} · ${progress.percent}%`
                : `${progress.percent}%`}
        </span>
      </div>
      <div
        role="progressbar"
        aria-label="Upload progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress.percent}
        className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-secondary)]"
      >
        <div
          className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-150 ease-out"
          style={{
            width: compressing
              ? "18%"
              : `${Math.max(saving ? 100 : progress.percent, 2)}%`,
          }}
        />
      </div>
    </div>
  );
}
