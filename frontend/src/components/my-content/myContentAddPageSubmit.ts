import { api, type UploadProgressHandler } from "@/lib/api";
import { pageHref } from "@/lib/myContentTree";
import { htmlForDocTemplate, type DocTemplateId } from "@/lib/docTemplates";
import {
  createSketchNotebookHtml,
  type SketchTemplate,
} from "@/lib/sketchNotebook";
import type {
  UserContentType,
  UserPageSummary,
  UserSubject,
  UserTopicGroup,
} from "@/types";
import type { PageAddMode } from "./MyContentAddModal";
import { runBulkFolderUpload, type BulkUploadProgress } from "./bulkFolderUpload";
import { emitContentChanged } from "@/lib/contentEvents";
import { isYoutubeUrl } from "@/lib/youtubeUrl";
import { VIDEO_NOTES_HTML } from "@/lib/videoNotesHtml";
import type { OptimisticOpenSeed } from "@/lib/optimisticOpenSeed";

function assertUploadOk(file: File) {
  const name = file.name.toLowerCase();
  if (!/\.(pdf|txt|md|markdown|docx)$/.test(name)) {
    throw new Error(
      "Use PDF, TXT, MD, or DOCX. HTML and other scriptable formats are not allowed."
    );
  }
}

export type AddPageOpenSeed = Omit<OptimisticOpenSeed, "href" | "pageId"> & {
  contentType: UserContentType;
};

export async function submitBulkFolderImport(input: {
  bulkFiles: File[];
  notebook?: UserSubject;
  notebookName: string;
  reportUploadProgress: UploadProgressHandler;
  onProgress: (progress: BulkUploadProgress) => void;
}) {
  let notebook = input.notebook;
  if (!notebook) {
    if (!input.notebookName.trim()) {
      throw new Error("Enter a collection name for this import.");
    }
    const { subject } = await api.myContent.createSubject({
      name: input.notebookName.trim(),
    });
    notebook = subject;
    emitContentChanged({ type: "notebook-created", subject });
  }

  return runBulkFolderUpload(notebook, input.bulkFiles, input.reportUploadProgress, {
    onProgress: input.onProgress,
    onTopicCreated: (payload) =>
      emitContentChanged({
        type: "topic-created",
        notebookId: payload.notebookId,
        notebookSlug: payload.notebookSlug,
        topicGroup: payload.topicGroup,
      }),
    onPageCreated: (payload) =>
      emitContentChanged({
        type: "page-created",
        page: payload.page,
        href: payload.href,
        notebookId: payload.notebookId,
        notebookSlug: payload.notebookSlug,
        topicId: payload.topicId,
        topicSlug: payload.topicSlug ?? null,
      }),
  });
}

export async function submitAddPage(input: {
  addMode: PageAddMode;
  pageTitle: string;
  pageLink: string;
  uploadFile: File | null;
  notebook?: UserSubject;
  topic?: UserTopicGroup;
  sketchTemplate: SketchTemplate;
  sketchBg: string;
  docTemplate?: DocTemplateId;
  reportUploadProgress: UploadProgressHandler;
}): Promise<{
  page: UserPageSummary;
  href: string;
  openSeed?: AddPageOpenSeed;
}> {
  const { notebook, topic } = input;
  let page: UserPageSummary;
  let openSeed: AddPageOpenSeed | undefined;

  if (input.addMode === "file" && input.uploadFile) {
    assertUploadOk(input.uploadFile);
    const fd = new FormData();
    fd.append("file", input.uploadFile);
    fd.append("title", input.pageTitle);
    if (notebook && topic) {
      ({ page } = await api.myContent.uploadFile(
        notebook.id,
        topic.id,
        fd,
        input.reportUploadProgress
      ));
    } else if (notebook) {
      ({ page } = await api.myContent.uploadNotebookFile(
        notebook.id,
        fd,
        input.reportUploadProgress
      ));
    } else {
      ({ page } = await api.myContent.uploadRootFile(
        fd,
        input.reportUploadProgress
      ));
    }
    if (page.contentType === "PDF") {
      openSeed = { contentType: "PDF", title: page.title };
    }
  } else if (
    input.addMode === "youtube" ||
    (input.addMode === "link" && isYoutubeUrl(input.pageLink))
  ) {
    const result = await api.myContent.importYoutube({
      sourceUrl: input.pageLink,
      title: input.pageTitle.trim() || undefined,
      notebookId: notebook?.id,
      topicId: topic?.id,
    });
    if (result.kind === "playlist") {
      emitContentChanged();
    } else {
      emitContentChanged({
        type: "page-created",
        page: result.page,
        href: result.href,
        notebookId: result.notebook?.id ?? notebook?.id,
        notebookSlug: result.notebook?.slug ?? notebook?.slug ?? null,
        topicId: result.topic?.id ?? topic?.id,
        topicSlug: result.topic?.slug ?? topic?.slug ?? null,
      });
      openSeed = {
        contentType: "VIDEO",
        title: result.page.title,
        sourceUrl: input.pageLink.trim(),
        content: VIDEO_NOTES_HTML,
      };
    }
    return { page: result.page, href: result.href, openSeed };
  } else if (input.addMode === "link") {
    const body = { title: input.pageTitle, sourceUrl: input.pageLink };
    if (notebook && topic) {
      ({ page } = await api.myContent.createPage(notebook.id, topic.id, body));
    } else if (notebook) {
      ({ page } = await api.myContent.createNotebookPage(notebook.id, body));
    } else {
      ({ page } = await api.myContent.createRootPage(body));
    }
    openSeed = {
      contentType: "LINK",
      title: page.title,
      sourceUrl: input.pageLink.trim(),
    };
  } else if (input.addMode === "sketch") {
    const htmlContent = createSketchNotebookHtml({
      bg: input.sketchBg,
      template: input.sketchTemplate,
    });
    const body = { title: input.pageTitle, htmlContent };
    if (notebook && topic) {
      ({ page } = await api.myContent.createPage(notebook.id, topic.id, body));
    } else if (notebook) {
      ({ page } = await api.myContent.createNotebookPage(notebook.id, body));
    } else {
      ({ page } = await api.myContent.createRootPage(body));
    }
    openSeed = {
      contentType: "HTML",
      title: page.title,
      content: htmlContent,
    };
  } else if (input.addMode === "doc") {
    const htmlContent = htmlForDocTemplate(
      input.docTemplate || "blank",
      input.pageTitle
    );
    const body = { title: input.pageTitle, htmlContent };
    if (notebook && topic) {
      ({ page } = await api.myContent.createPage(notebook.id, topic.id, body));
    } else if (notebook) {
      ({ page } = await api.myContent.createNotebookPage(notebook.id, body));
    } else {
      ({ page } = await api.myContent.createRootPage(body));
    }
    openSeed = {
      contentType: "HTML",
      title: page.title,
      content: htmlContent,
    };
  } else {
    throw new Error("Choose a page type to create.");
  }

  const href = pageHref(notebook?.slug, topic?.slug, page.slug);
  emitContentChanged({
    type: "page-created",
    page,
    href,
    notebookId: notebook?.id,
    notebookSlug: notebook?.slug ?? null,
    topicId: topic?.id,
    topicSlug: topic?.slug ?? null,
  });
  return { page, href, openSeed };
}
