import { api, type UploadProgressHandler } from "@/lib/api";
import { clearPdfByteCache } from "@/lib/pdfByteCache";
import { mapWithConcurrency } from "@/lib/mapWithConcurrency";
import { pageHref } from "@/lib/myContentTree";
import { dispatchSyncStatus } from "@/lib/syncStatus";
import {
  beginUploadActivity,
  clearActiveUploadActivity,
  upsertSyncActivity,
} from "@/lib/syncActivityStore";
import {
  formatBulkImportSummary,
  rememberFailedBulkUpload,
} from "@/lib/failedBulkUploads";
import type { UserPageSummary, UserSubject, UserTopicGroup } from "@/types";
import {
  groupFilesForBulkUpload,
  titleFromFile,
} from "./myContentAddUtils";

/** Parallel PUTs — enough for snappy batches without saturating the tab. */
export const BULK_UPLOAD_CONCURRENCY = 3;

/** Free reopen-cache space before large imports so deferred retries can land. */
const CLEAR_CACHE_AT_FILES = 8;

export type BulkUploadProgress = {
  done: number;
  total: number;
  label: string;
  failed?: number;
};

export type BulkUploadCallbacks = {
  onProgress?: (progress: BulkUploadProgress) => void;
  onTopicCreated?: (payload: {
    notebookId: string;
    notebookSlug: string;
    topicGroup: UserTopicGroup;
  }) => void;
  onPageCreated?: (payload: {
    page: UserPageSummary;
    href: string;
    notebookId: string;
    notebookSlug: string;
    topicId?: string;
    topicSlug?: string | null;
  }) => void;
};

export type BulkUploadResult = {
  last: { page: UserPageSummary; href: string } | null;
  succeeded: number;
  failed: number;
  errors: string[];
  batchId: string;
};

type BulkJob = {
  file: File;
  title: string;
  topicGroupId?: string;
  topicSlug: string | null;
};

/**
 * Import many files/folders into a collection.
 * Topics are created sequentially; file PUTs run with limited concurrency.
 * One failure does not abort the rest. Failed Files stay in-session for
 * Sync → Retry failed.
 */
export async function runBulkFolderUpload(
  notebook: UserSubject,
  files: File[],
  reportFileProgress?: UploadProgressHandler,
  callbacks?: BulkUploadCallbacks
): Promise<BulkUploadResult> {
  const groups = groupFilesForBulkUpload(files);
  const fileCount = groups.reduce((n, g) => n + g.files.length, 0);
  if (fileCount === 0) {
    throw new Error("No PDF or document files found in the selected folders.");
  }

  if (fileCount >= CLEAR_CACHE_AT_FILES) {
    void clearPdfByteCache();
  }

  const topicByTitle = new Map<string, { id: string; slug: string }>();
  const jobs: BulkJob[] = [];

  for (const group of groups) {
    let topicGroupId: string | undefined;
    let topicSlug: string | null = null;

    if (group.topicTitle) {
      let topic = topicByTitle.get(group.topicTitle);
      if (!topic) {
        const { topicGroup } = await api.myContent.createTopicGroup(
          notebook.id,
          { title: group.topicTitle }
        );
        topic = { id: topicGroup.id, slug: topicGroup.slug };
        topicByTitle.set(group.topicTitle, topic);
        callbacks?.onTopicCreated?.({
          notebookId: notebook.id,
          notebookSlug: notebook.slug,
          topicGroup: { ...topicGroup, pages: topicGroup.pages ?? [] },
        });
      }
      topicGroupId = topic.id;
      topicSlug = topic.slug;
    }

    for (const file of group.files) {
      jobs.push({
        file,
        title: titleFromFile(file),
        topicGroupId,
        topicSlug,
      });
    }
  }

  const batchId = `bulk:${crypto.randomUUID()}`;
  beginUploadActivity(
    jobs.length === 1
      ? jobs[0]!.title
      : `Importing ${jobs.length} files`,
    batchId
  );
  dispatchSyncStatus({
    state: "uploading",
    label: "Uploading",
    percent: 0,
  });

  let done = 0;
  let failed = 0;
  let succeeded = 0;
  const errors: string[] = [];
  const failedNames: string[] = [];
  let last: { page: UserPageSummary; href: string } | null = null;

  const bump = (label: string) => {
    const percent =
      jobs.length === 0 ? 100 : Math.round((done / jobs.length) * 100);
    callbacks?.onProgress?.({
      done,
      total: jobs.length,
      label,
      failed,
    });
    upsertSyncActivity({
      id: batchId,
      kind: "upload",
      title:
        jobs.length === 1
          ? jobs[0]!.title
          : `Importing ${done}/${jobs.length}`,
      status: "uploading",
      percent,
      detail:
        failed > 0
          ? `${succeeded} uploaded · ${failed} failed · ${label}`
          : `${succeeded} uploaded · ${label}`,
    });
    dispatchSyncStatus({
      state: "uploading",
      label: "Uploading",
      percent,
    });
  };

  bump("Starting…");

  await mapWithConcurrency(jobs, BULK_UPLOAD_CONCURRENCY, async (job) => {
    const fd = new FormData();
    fd.append("file", job.file);
    fd.append("title", job.title);
    try {
      const result = job.topicGroupId
        ? await api.myContent.uploadFile(
            notebook.id,
            job.topicGroupId,
            fd,
            reportFileProgress,
            undefined,
            { seedPdfCache: false }
          )
        : await api.myContent.uploadNotebookFile(
            notebook.id,
            fd,
            reportFileProgress,
            undefined,
            { seedPdfCache: false }
          );
      const page = result.page;
      const href = pageHref(notebook.slug, job.topicSlug, page.slug);
      last = { page, href };
      succeeded += 1;
      done += 1;
      bump(job.file.name);
      if (!result.deferred) {
        callbacks?.onPageCreated?.({
          page,
          href,
          notebookId: notebook.id,
          notebookSlug: notebook.slug,
          topicId: job.topicGroupId,
          topicSlug: job.topicSlug,
        });
      }
    } catch (err) {
      failed += 1;
      done += 1;
      const message = err instanceof Error ? err.message : "Upload failed";
      errors.push(`${job.file.name}: ${message}`);
      failedNames.push(job.file.name);
      rememberFailedBulkUpload({
        batchId,
        file: job.file,
        title: job.title,
        notebookId: notebook.id,
        notebookSlug: notebook.slug,
        topicGroupId: job.topicGroupId,
        topicSlug: job.topicSlug,
        lastError: message,
      });
      bump(job.file.name);
    }
  });

  const summary = formatBulkImportSummary({
    succeeded,
    failed,
    total: jobs.length,
    sampleNames: failedNames,
  });

  if (failed === 0) {
    upsertSyncActivity({
      id: batchId,
      kind: "upload",
      title: summary.title,
      status: "done",
      percent: 100,
      detail: summary.detail,
    });
    clearActiveUploadActivity();
    dispatchSyncStatus({ state: "synced", label: "Synced" });
  } else {
    upsertSyncActivity({
      id: batchId,
      kind: "upload",
      title: summary.title,
      status: "error",
      percent: 100,
      detail: summary.detail,
    });
    clearActiveUploadActivity();
    dispatchSyncStatus({ state: "error", label: "Not synced" });
  }

  if (succeeded === 0 && failed > 0) {
    throw new Error(errors[0] ?? "Folder import failed");
  }

  return { last, succeeded, failed, errors, batchId };
}
