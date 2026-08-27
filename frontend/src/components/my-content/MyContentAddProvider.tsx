"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type DragEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { api, type UploadProgress, type UploadProgressHandler } from "@/lib/api";
import { requireOnline } from "@/lib/offline/notice";
import { pageHref, getTopicGroups } from "@/lib/myContentTree";
import { UserPageSummary, UserSubject, UserTopicGroup } from "@/types";
import { MyContentAddModal, AddModalKind } from "./MyContentAddModal";
import { SHELF_OPEN_ADD } from "@/lib/hotkeys";
import {
  emitContentChanged,
  emitOpenPage,
} from "@/lib/contentEvents";
import { isReaderHref } from "@/lib/softNavigate";
import { scopeFromHref } from "@/components/my-content/reader/types";
import { createDocHtml } from "@/lib/docEditor";
import {
  createSketchNotebookHtml,
  type SketchTemplate,
} from "@/lib/sketchNotebook";
import { findCachedSubject } from "@/lib/offline/library";
import {
  addContextFromPath,
  isFileDrag,
  pickDroppedFile,
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
  /** Open the page modal on a specific tab (upload / sketch / doc / URL). */
  pageMode?: "file" | "sketch" | "doc" | "link";
}

interface AddContextValue {
  openAdd: (target: AddTarget) => void;
}

const AddContext = createContext<AddContextValue | null>(null);

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
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(
    null
  );
  const [message, setMessage] = useState("");
  const [addMode, setAddMode] = useState<"file" | "sketch" | "doc" | "link">("file");
  const [pageLink, setPageLink] = useState("");
  const [sketchTemplate, setSketchTemplate] = useState<SketchTemplate>("ruled");
  const [sketchBg, setSketchBg] = useState("#ffffff");

  const reset = () => {
    setNotebookName("");
    setNotebookDesc("");
    setTopicTitle("");
    setPageTitle("");
    setUploadFile(null);
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
    setTarget({ ...next, kind: next.file ? "page" : next.kind, file: undefined });
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
      loaded: next.loaded || prev?.loaded || 0,
      total: next.total || prev?.total || 0,
      percent: next.percent,
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

  const assertUploadOk = (file: File) => {
    const name = file.name.toLowerCase();
    if (!/\.(pdf|txt|md|markdown|docx)$/.test(name)) {
      throw new Error(
        "Use PDF, TXT, MD, or DOCX. HTML and other scriptable formats are not allowed."
      );
    }
  };

  const handleAddPage = async (e: FormEvent) => {
    e.preventDefault();
    if (!pageTitle.trim()) return;
    if (!requireOnline("Add pages")) return;
    setSubmitting(true);
    setMessage("");
    try {
      const notebook = target?.notebook;
      const topic = target?.topic;
      let page: UserPageSummary;

      if (addMode === "file" && uploadFile) {
        assertUploadOk(uploadFile);
        const fd = new FormData();
        fd.append("file", uploadFile);
        fd.append("title", pageTitle);
        setUploadProgress({
          loaded: 0,
          total: uploadFile.size,
          percent: 0,
        });
        if (notebook && topic) {
          ({ page } = await api.myContent.uploadFile(
            notebook.id,
            topic.id,
            fd,
            reportUploadProgress
          ));
        } else if (notebook) {
          ({ page } = await api.myContent.uploadNotebookFile(
            notebook.id,
            fd,
            reportUploadProgress
          ));
        } else {
          ({ page } = await api.myContent.uploadRootFile(
            fd,
            reportUploadProgress
          ));
        }
      } else if (addMode === "link") {
        const body = { title: pageTitle, sourceUrl: pageLink };
        if (notebook && topic) {
          ({ page } = await api.myContent.createPage(notebook.id, topic.id, body));
        } else if (notebook) {
          ({ page } = await api.myContent.createNotebookPage(notebook.id, body));
        } else {
          ({ page } = await api.myContent.createRootPage(body));
        }
      } else if (addMode === "sketch") {
        const body = {
          title: pageTitle,
          htmlContent: createSketchNotebookHtml({
            bg: sketchBg,
            template: sketchTemplate,
          }),
        };
        if (notebook && topic) {
          ({ page } = await api.myContent.createPage(notebook.id, topic.id, body));
        } else if (notebook) {
          ({ page } = await api.myContent.createNotebookPage(notebook.id, body));
        } else {
          ({ page } = await api.myContent.createRootPage(body));
        }
      } else {
        const body = {
          title: pageTitle,
          htmlContent: createDocHtml(pageTitle),
        };
        if (notebook && topic) {
          ({ page } = await api.myContent.createPage(notebook.id, topic.id, body));
        } else if (notebook) {
          ({ page } = await api.myContent.createNotebookPage(notebook.id, body));
        } else {
          ({ page } = await api.myContent.createRootPage(body));
        }
      }

      close();
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
      openCreatedPage(href, page);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to add page");
    } finally {
      setSubmitting(false);
      setUploadProgress(null);
    }
  };

  const value = useMemo(() => ({ openAdd }), [openAdd]);

  const [fileDragDepth, setFileDragDepth] = useState(0);

  const openDroppedFile = useCallback(
    (file: File) => {
      const ctx = addContextFromPath(window.location.pathname);
      if (!ctx.notebookSlug) {
        openAdd({ kind: "page", file });
        return;
      }
      const apply = (subject: UserSubject) => {
        const topic = ctx.topicSlug
          ? getTopicGroups(subject).find((g) => g.slug === ctx.topicSlug)
          : undefined;
        openAdd({ kind: "page", notebook: subject, topic, file });
      };
      const cached = findCachedSubject(ctx.notebookSlug);
      if (cached) {
        apply(cached);
        return;
      }
      openAdd({ kind: "page", file });
      void api.myContent
        .getSubject(ctx.notebookSlug)
        .then(({ subject }) => apply(subject))
        .catch(() => {});
    },
    [openAdd]
  );

  const onFileDragEnter = useCallback((e: DragEvent) => {
    if (!isFileDrag(e)) return;
    e.preventDefault();
    e.stopPropagation();
    setFileDragDepth((d) => d + 1);
  }, []);

  const onFileDragLeave = useCallback((e: DragEvent) => {
    if (!isFileDrag(e)) return;
    e.preventDefault();
    e.stopPropagation();
    setFileDragDepth((d) => Math.max(0, d - 1));
  }, []);

  const onFileDragOver = useCallback((e: DragEvent) => {
    if (!isFileDrag(e)) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const onFileDrop = useCallback(
    (e: DragEvent) => {
      if (!isFileDrag(e)) return;
      e.preventDefault();
      e.stopPropagation();
      setFileDragDepth(0);
      if (submitting) return;
      const file = pickDroppedFile(e.dataTransfer.files);
      if (!file) return;
      // If add modal already open on page/file mode, just fill the file.
      if (target?.kind === "page") {
        setAddMode("file");
        setUploadFile(file);
        setPageTitle((t) => t.trim() || titleFromFile(file));
        return;
      }
      void openDroppedFile(file);
    },
    [openDroppedFile, submitting, target?.kind]
  );

  // Only force a topic name when creating inside a notebook without a topic
  // and the user somehow still needs one — we no longer auto-create topics.
  const needsTopic = false;

  return (
    <AddContext.Provider value={value}>
      <div
        className="relative h-full min-h-0"
        inert={target ? true : undefined}
        onDragEnter={onFileDragEnter}
        onDragLeave={onFileDragLeave}
        onDragOver={onFileDragOver}
        onDrop={onFileDrop}
      >
        {children}
        {fileDragDepth > 0 && (
          <div
            className="pointer-events-none absolute inset-0 z-[60] flex items-center justify-center bg-[var(--bg-primary)]/75 backdrop-blur-[1px]"
            aria-hidden
          >
            <div className="rounded-2xl border-2 border-dashed border-[var(--accent)] bg-[var(--bg-elevated)] px-8 py-6 text-center shadow-xl">
              <p className="text-base font-semibold text-[var(--text-primary)]">
                Drop to upload
              </p>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                PDF, TXT, MD, or DOCX
              </p>
            </div>
          </div>
        )}
      </div>
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
