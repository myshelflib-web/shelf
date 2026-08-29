"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { api, type UploadProgress, type UploadProgressHandler, getStoredUser } from "@/lib/api";
import { shouldCompressUpload } from "@/lib/compressUploadFile";
import { requireOnline } from "@/lib/offline/notice";
import { getTopicGroups } from "@/lib/myContentTree";
import { UserPageSummary, UserSubject, UserTopicGroup } from "@/types";
import { MyContentAddModal, type AddModalKind } from "./MyContentAddModal";
import { MyContentAddDropLayer } from "./MyContentAddDropLayer";
import {
  submitAddPage,
  submitBulkFolderImport,
} from "./myContentAddPageSubmit";
import { useMyContentAddDrop } from "./useMyContentAddDrop";
import { SHELF_OPEN_ADD } from "@/lib/hotkeys";
import {
  emitContentChanged,
  emitOpenPage,
} from "@/lib/contentEvents";
import {
  AnalyticsEvents,
  AnalyticsFirstTimeFlags,
  track,
  trackOncePerUser,
} from "@/lib/analytics";
import { isReaderHref } from "@/lib/softNavigate";
import { scopeFromHref } from "@/components/my-content/reader/types";
import type { SketchTemplate } from "@/lib/sketchNotebook";
import { findCachedSubject } from "@/lib/offline/library";
import {
  addContextFromPath,
  titleFromFile,
} from "./myContentAddUtils";

export interface AddTarget {
  kind: AddModalKind;
  /** Omit notebook to create a library-root page */
  notebook?: UserSubject;
  /** Omit topic (with notebook set) for a notebook-level page */
  topic?: UserTopicGroup;
  /** Prefill the upload field (e.g. after a drag-and-drop). */
  file?: File;
  /** Open the page modal on a specific tab (upload / sketch / doc / URL / bulk). */
  pageMode?: "file" | "bulk" | "sketch" | "doc" | "link" | "youtube";
  /** Prefill bulk folder import. */
  bulkFiles?: File[];
}

interface AddContextValue {
  openAdd: (target: AddTarget) => void;
}

const AddContext = createContext<AddContextValue | null>(null);

function trackUploadAnalytics(
  phase: "started" | "completed" | "failed",
  props: {
    addMode: string;
    contentType?: string;
    error?: string;
  }
) {
  const userId = getStoredUser()?.id;
  if (phase === "failed") {
    track(AnalyticsEvents.uploadError, {
      addMode: props.addMode,
      contentType: props.contentType,
      error: props.error,
    });
    if (userId) {
      trackOncePerUser(userId, AnalyticsFirstTimeFlags.uploadFailed, AnalyticsEvents.firstUploadFailed, {
        addMode: props.addMode,
        error: props.error,
      });
    }
    return;
  }
  if (!userId) return;
  if (phase === "started") {
    trackOncePerUser(userId, AnalyticsFirstTimeFlags.uploadStarted, AnalyticsEvents.firstUploadStarted, {
      addMode: props.addMode,
    });
    return;
  }
  trackOncePerUser(userId, AnalyticsFirstTimeFlags.uploadCompleted, AnalyticsEvents.firstUploadCompleted, {
    addMode: props.addMode,
    contentType: props.contentType,
  });
}

export function useAddContent() {
  const ctx = useContext(AddContext);
  if (!ctx) {
    return {
      openAdd: () => {
        /* provider missing */
      },
    };
  }
  return ctx;
}

export function MyContentAddProvider({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const [target, setTarget] = useState<AddTarget | null>(null);
  const [notebookName, setNotebookName] = useState("");
  const [notebookDesc, setNotebookDesc] = useState("");
  const [topicTitle, setTopicTitle] = useState("");
  const [pageTitle, setPageTitle] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [bulkFiles, setBulkFiles] = useState<File[]>([]);
  const [bulkProgress, setBulkProgress] = useState<{
    done: number;
    total: number;
    label: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(
    null
  );
  const [message, setMessage] = useState("");
  const [addMode, setAddMode] = useState<
    "file" | "bulk" | "sketch" | "doc" | "link" | "youtube"
  >("file");
  const [pageLink, setPageLink] = useState("");
  const [sketchTemplate, setSketchTemplate] = useState<SketchTemplate>("ruled");
  const [sketchBg, setSketchBg] = useState("#ffffff");

  const reset = () => {
    setNotebookName("");
    setNotebookDesc("");
    setTopicTitle("");
    setPageTitle("");
    setUploadFile(null);
    setBulkFiles([]);
    setBulkProgress(null);
    setPageLink("");
    setAddMode("file");
    setSketchTemplate("ruled");
    setSketchBg("#ffffff");
    setMessage("");
    setSubmitting(false);
    setUploadProgress(null);
  };

  const openAdd = useCallback((next: AddTarget) => {
    reset();
    if (next.file) {
      setAddMode("file");
      setUploadFile(next.file);
      setPageTitle(titleFromFile(next.file));
    } else if (next.pageMode) {
      setAddMode(next.pageMode);
    }
    if (next.bulkFiles?.length) {
      setAddMode("bulk");
      setBulkFiles(next.bulkFiles);
    }
    setTarget({
      ...next,
      kind: next.file || next.bulkFiles?.length ? "page" : next.kind,
      file: undefined,
      bulkFiles: undefined,
    });
  }, []);

  const openAddFromHotkey = useCallback((kind: AddModalKind) => {
    if (kind === "notebook") {
      openAdd({ kind: "notebook" });
      return;
    }
    const ctx = addContextFromPath(window.location.pathname);
    if (!ctx.notebookSlug) {
      openAdd({ kind: kind === "topic" ? "notebook" : "page" });
      return;
    }
    const apply = (subject: UserSubject) => {
      const topic = ctx.topicSlug
        ? getTopicGroups(subject).find((g) => g.slug === ctx.topicSlug)
        : undefined;
      if (kind === "topic") openAdd({ kind: "topic", notebook: subject });
      else openAdd({ kind: "page", notebook: subject, topic });
    };
    const cached = findCachedSubject(ctx.notebookSlug);
    if (cached) {
      apply(cached);
      return;
    }
    openAdd({ kind: kind === "topic" ? "notebook" : "page" });
    void api.myContent
      .getSubject(ctx.notebookSlug)
      .then(({ subject }) => apply(subject))
      .catch(() => {});
  }, [openAdd]);

  useEffect(() => {
    const onOpen = (e: Event) => {
      const kind = (e as CustomEvent<{ kind?: AddModalKind }>).detail?.kind;
      if (!kind) return;
      void openAddFromHotkey(kind);
    };
    window.addEventListener(SHELF_OPEN_ADD, onOpen);
    return () => window.removeEventListener(SHELF_OPEN_ADD, onOpen);
  }, [openAddFromHotkey]);

  const close = useCallback(() => {
    setTarget(null);
    reset();
  }, []);

  const reportUploadProgress: UploadProgressHandler = useCallback((next) => {
    setUploadProgress((prev) => ({
      loaded: next.loaded ?? prev?.loaded ?? 0,
      total: next.total ?? prev?.total ?? 0,
      percent: next.percent,
      phase: next.phase ?? prev?.phase,
    }));
  }, []);

  const openCreatedPage = useCallback(
    (href: string, page: UserPageSummary) => {
      const scope = scopeFromHref(href);
      if (scope && isReaderHref(window.location.pathname)) {
        emitOpenPage({
          href,
          title: page.title,
          pageId: page.id,
          scope,
        });
        return;
      }
      router.push(href);
    },
    [router]
  );

  const handleCreateNotebook = async (e: FormEvent) => {
    e.preventDefault();
    if (!notebookName.trim()) return;
    if (!requireOnline("Add collections")) return;
    setSubmitting(true);
    try {
      const { subject } = await api.myContent.createSubject({
        name: notebookName,
        description: notebookDesc || undefined,
      });
      close();
      emitContentChanged({ type: "notebook-created", subject });
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to create collection");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateTopic = async (e: FormEvent) => {
    e.preventDefault();
    if (!target?.notebook || !topicTitle.trim()) return;
    if (!requireOnline("Add topics")) return;
    setSubmitting(true);
    try {
      const { topicGroup } = await api.myContent.createTopicGroup(
        target.notebook.id,
        { title: topicTitle }
      );
      close();
      emitContentChanged({
        type: "topic-created",
        notebookId: target.notebook.id,
        notebookSlug: target.notebook.slug,
        topicGroup: { ...topicGroup, pages: topicGroup.pages ?? [] },
      });
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to create topic");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddPage = async (e: FormEvent) => {
    e.preventDefault();
    if (addMode === "bulk") {
      if (bulkFiles.length === 0) return;
      if (!requireOnline("Import folders")) return;
      setSubmitting(true);
      setMessage("");
      setBulkProgress({ done: 0, total: bulkFiles.length, label: "Starting…" });
      trackUploadAnalytics("started", { addMode: "bulk" });
      try {
        const result = await submitBulkFolderImport({
          bulkFiles,
          notebook: target?.notebook,
          notebookName,
          reportUploadProgress,
          onProgress: setBulkProgress,
        });
        close();
        if (result) {
          trackUploadAnalytics("completed", {
            addMode: "bulk",
            contentType: result.page.contentType,
          });
          openCreatedPage(result.href, result.page);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Folder import failed";
        setMessage(message);
        trackUploadAnalytics("failed", { addMode: "bulk", error: message });
      } finally {
        setSubmitting(false);
        setBulkProgress(null);
        setUploadProgress(null);
      }
      return;
    }
    if (!pageTitle.trim() && addMode !== "youtube") return;
    if (!requireOnline("Add pages")) return;
    setSubmitting(true);
    setMessage("");
    const isFileUpload = addMode === "file" && Boolean(uploadFile);
    if (isFileUpload) {
      trackUploadAnalytics("started", { addMode });
    }
    try {
      if (isFileUpload && uploadFile) {
        setUploadProgress({
          loaded: 0,
          total: uploadFile.size,
          percent: 0,
          phase: shouldCompressUpload(uploadFile) ? "compressing" : "uploading",
        });
      }
      const { page, href } = await submitAddPage({
        addMode,
        pageTitle,
        pageLink,
        uploadFile,
        notebook: target?.notebook,
        topic: target?.topic,
        sketchTemplate,
        sketchBg,
        reportUploadProgress,
      });
      close();
      if (isFileUpload) {
        trackUploadAnalytics("completed", {
          addMode,
          contentType: page.contentType,
        });
      }
      openCreatedPage(href, page);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to add page";
      setMessage(message);
      if (isFileUpload) {
        trackUploadAnalytics("failed", { addMode, error: message });
      } else {
        track(AnalyticsEvents.uploadError, { addMode, error: message });
      }
    } finally {
      setSubmitting(false);
      setUploadProgress(null);
    }
  };

  const value = useMemo(() => ({ openAdd }), [openAdd]);

  const {
    fileDragDepth,
    onFileDragEnter,
    onFileDragLeave,
    onFileDragOver,
    onFileDrop,
  } = useMyContentAddDrop({
    submitting,
    targetKind: target?.kind,
    openAdd,
    setAddMode,
    setUploadFile,
    setPageTitle,
  });

  const needsTopic = false;

  return (
    <AddContext.Provider value={value}>
      <MyContentAddDropLayer
        fileDragDepth={fileDragDepth}
        inert={Boolean(target)}
        onDragEnter={onFileDragEnter}
        onDragLeave={onFileDragLeave}
        onDragOver={onFileDragOver}
        onDrop={onFileDrop}
      >
        {children}
      </MyContentAddDropLayer>
      {target && (
        <MyContentAddModal
          kind={target.kind}
          notebookName={target.notebook?.name}
          topicTitle={target.topic?.title}
          needsTopicName={needsTopic}
          notebookNameInput={notebookName}
          notebookDesc={notebookDesc}
          topicTitleInput={topicTitle}
          pageTitle={pageTitle}
          addMode={addMode}
          pageLink={pageLink}
          uploadFile={uploadFile}
          bulkFiles={bulkFiles}
          bulkProgress={bulkProgress}
          submitting={submitting}
          uploadProgress={uploadProgress}
          message={message}
          onNotebookNameChange={setNotebookName}
          onNotebookDescChange={setNotebookDesc}
          onTopicTitleChange={setTopicTitle}
          onPageTitleChange={setPageTitle}
          onAddModeChange={setAddMode}
          onPageLinkChange={setPageLink}
          onUploadFileChange={setUploadFile}
          onBulkFilesChange={setBulkFiles}
          sketchTemplate={sketchTemplate}
          sketchBg={sketchBg}
          onSketchTemplateChange={setSketchTemplate}
          onSketchBgChange={setSketchBg}
          onSubmitNotebook={handleCreateNotebook}
          onSubmitTopic={handleCreateTopic}
          onSubmitPage={handleAddPage}
          onClose={close}
        />
      )}
    </AddContext.Provider>
  );
}
