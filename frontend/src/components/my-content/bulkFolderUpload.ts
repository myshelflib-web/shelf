import { api, type UploadProgressHandler } from "@/lib/api";
import { pageHref } from "@/lib/myContentTree";
import type { UserPageSummary, UserSubject, UserTopicGroup } from "@/types";
import {
  groupFilesForBulkUpload,
  titleFromFile,
} from "./myContentAddUtils";

export type BulkUploadProgress = {
  done: number;
  total: number;
  label: string;
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

export async function runBulkFolderUpload(
  notebook: UserSubject,
  files: File[],
  reportFileProgress?: UploadProgressHandler,
  callbacks?: BulkUploadCallbacks
): Promise<{ page: UserPageSummary; href: string } | null> {
  const groups = groupFilesForBulkUpload(files);
  const total = groups.reduce((n, g) => n + g.files.length, 0);
  if (total === 0) {
    throw new Error("No PDF or document files found in the selected folders.");
  }

  const topicByTitle = new Map<
    string,
    { id: string; slug: string }
  >();
  let done = 0;
  let last: { page: UserPageSummary; href: string } | null = null;

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
      done += 1;
      callbacks?.onProgress?.({
        done,
        total,
        label: file.name,
      });

      const fd = new FormData();
      fd.append("file", file);
      fd.append("title", titleFromFile(file));

      const { page } = topicGroupId
        ? await api.myContent.uploadFile(
            notebook.id,
            topicGroupId,
            fd,
            reportFileProgress
          )
        : await api.myContent.uploadNotebookFile(
            notebook.id,
            fd,
            reportFileProgress
          );

      const href = pageHref(notebook.slug, topicSlug, page.slug);
      last = { page, href };
      callbacks?.onPageCreated?.({
        page,
        href,
        notebookId: notebook.id,
        notebookSlug: notebook.slug,
        topicId: topicGroupId,
        topicSlug,
      });
    }
  }

  return last;
}
