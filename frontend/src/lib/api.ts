import { clearAccountLocalState } from "@/lib/accountLocalState";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function isNetworkError(err: unknown): boolean {
  return err instanceof ApiError && err.status === 0;
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    cache: "no-store",
    ...options,
    headers,
  }).catch(() => {
    throw new ApiError(
      "Cannot reach the server. Check that the backend is running and NEXT_PUBLIC_API_URL is correct.",
      0,
    );
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Request failed" }));
    throw new ApiError(error.error ?? "Request failed", res.status);
  }

  const text = await res.text();
  if (!text) {
    throw new Error("Empty response from server");
  }
  return JSON.parse(text) as T;
}

export type UploadProgress = {
  loaded: number;
  total: number;
  percent: number;
};

export type UploadProgressHandler = (progress: UploadProgress) => void;

export type PresignedPdf = {
  url: string;
  version: string;
  expiresIn: number;
};

async function fetchStorageBlob(url: string): Promise<Blob> {
  const res = await fetch(url).catch(() => {
    throw new ApiError(
      "Cannot reach storage. Check that MinIO/R2 is running and bucket CORS allows this site.",
      0
    );
  });
  if (!res.ok) {
    throw new ApiError("Could not load PDF", res.status);
  }
  return res.blob();
}

function putToUrl(
  url: string,
  body: Blob,
  contentType: string,
  onProgress?: UploadProgressHandler
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", contentType);

    xhr.upload.onprogress = (event) => {
      if (!onProgress) return;
      const total = event.lengthComputable ? event.total : 0;
      const loaded = event.loaded;
      const percent =
        total > 0 ? Math.min(100, Math.round((loaded / total) * 100)) : 0;
      onProgress({ loaded, total, percent });
    };

    xhr.upload.onload = () => {
      onProgress?.({ loaded: body.size, total: body.size, percent: 100 });
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
        return;
      }
      reject(new ApiError("Upload to storage failed", xhr.status));
    };

    xhr.onerror = () => {
      reject(
        new ApiError(
          "Cannot reach storage. Check that MinIO/R2 is running and bucket CORS allows this site.",
          0
        )
      );
    };

    xhr.send(body);
  });
}

function fileFromForm(formData: FormData): { file: File; title: string } {
  const file = formData.get("file");
  const title = String(formData.get("title") ?? "").trim();
  if (!(file instanceof File) || !title) {
    throw new ApiError("Title and file required", 400);
  }
  return { file, title };
}

async function uploadLibraryFile(
  file: File,
  title: string,
  scope: { subjectId?: string; topicGroupId?: string },
  onProgress?: UploadProgressHandler
) {
  const init = await request<{
    uploadUrl: string;
    headers: { "Content-Type": string };
    token: string;
  }>("/api/my-content/uploads/init", {
    method: "POST",
    body: JSON.stringify({
      title,
      filename: file.name,
      contentType: file.type,
      size: file.size,
      subjectId: scope.subjectId,
      topicGroupId: scope.topicGroupId,
    }),
  });
  await putToUrl(
    init.uploadUrl,
    file,
    init.headers["Content-Type"],
    onProgress
  );
  return request<{ page: import("@/types").UserPageSummary; message?: string }>(
    "/api/my-content/uploads/complete",
    { method: "POST", body: JSON.stringify({ token: init.token }) }
  );
}

type StudySseHandlers = {
  onStatus?: (
    stage: string,
    detail?: string,
    extra?: Record<string, unknown>
  ) => void;
  onDelta?: (text: string) => void;
  onDone?: (meta: Record<string, unknown>) => void;
};

function parseSseErrorBody(raw: string): string {
  let parsed: { error?: string } = {};
  try {
    parsed = JSON.parse(raw) as { error?: string };
  } catch {
    /* HTML / empty from proxy */
  }
  return (
    parsed.error ||
    (raw
      ? raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 160)
      : "")
  );
}

async function consumeStudySse(
  res: Response,
  handlers: StudySseHandlers
): Promise<{ gotDelta: boolean; gotDone: boolean; gotStatus: boolean }> {
  if (!res.body) return { gotDelta: false, gotDone: false, gotStatus: false };

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let streamError: string | null = null;
  let gotDelta = false;
  let gotDone = false;
  let gotStatus = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() ?? "";

    for (const chunk of chunks) {
      const lines = chunk.split("\n");
      let event = "message";
      const dataLines: string[] = [];
      for (const line of lines) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
      }
      if (dataLines.length === 0) continue;
      let payload: Record<string, unknown> = {};
      try {
        payload = JSON.parse(dataLines.join("\n")) as Record<string, unknown>;
      } catch {
        continue;
      }

      if (event === "status") {
        gotStatus = true;
        handlers.onStatus?.(
          String(payload.stage ?? ""),
          payload.detail ? String(payload.detail) : undefined,
          payload
        );
      } else if (event === "delta") {
        gotDelta = true;
        handlers.onDelta?.(String(payload.text ?? ""));
      } else if (event === "done") {
        gotDone = true;
        handlers.onDone?.(payload);
      } else if (event === "error") {
        streamError = String(payload.message ?? "Study AI failed");
      }
    }
  }

  if (streamError) throw new Error(streamError);
  return { gotDelta, gotDone, gotStatus };
}

async function postStudySse(
  path: string,
  body: unknown,
  handlers: StudySseHandlers & { signal?: AbortSignal },
  fallback: () => Promise<void>
) {
  const token = getToken();
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      cache: "no-store",
      signal: handlers.signal,
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
  } catch {
    await fallback();
    return;
  }

  if (!res.ok || !res.body) {
    const raw = await res.text().catch(() => "");
    const detail = parseSseErrorBody(raw);
    if ([404, 405, 501, 502, 503].includes(res.status)) {
      try {
        await fallback();
        return;
      } catch (fallbackErr) {
        throw fallbackErr instanceof Error
          ? fallbackErr
          : new Error(detail || `Study AI failed (HTTP ${res.status})`);
      }
    }
    throw new Error(
      detail || `Study AI failed (HTTP ${res.status}). Check backend logs.`
    );
  }

  const { gotDelta, gotDone, gotStatus } = await consumeStudySse(res, handlers);
  if (!gotDelta && !gotDone && !gotStatus) {
    await fallback();
  }
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ user: import("@/types").User; token: string }>(
        "/api/auth/login",
        { method: "POST", body: JSON.stringify({ email, password }) }
      ),
    register: (email: string, password: string, name: string) =>
      request<{ user: import("@/types").User; token: string }>(
        "/api/auth/register",
        { method: "POST", body: JSON.stringify({ email, password, name }) }
      ),
    me: () => request<{ user: import("@/types").User }>("/api/auth/me"),
    updateMe: (data: {
      studyGoal?: import("@/types").StudyGoal;
      name?: string;
      avatarUrl?: string | null;
      currentPassword?: string;
      newPassword?: string;
    }) =>
      request<{ user: import("@/types").User }>("/api/auth/me", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    uploadAvatar: (file: File) => {
      const formData = new FormData();
      formData.append("avatar", file);
      return request<{ user: import("@/types").User }>("/api/auth/me/avatar", {
        method: "POST",
        body: formData,
      });
    },
    deleteMe: () =>
      request<{ ok: boolean }>("/api/auth/me", { method: "DELETE" }),
    google: (credential: string) =>
      request<{ user: import("@/types").User; token: string }>(
        "/api/auth/google",
        { method: "POST", body: JSON.stringify({ credential }) }
      ),
  },

  subjects: {
    list: (opts?: { studyGoal?: import("@/types").StudyGoal }) => {
      const q = opts?.studyGoal
        ? `?studyGoal=${encodeURIComponent(opts.studyGoal)}`
        : "";
      return request<{ subjects: import("@/types").Subject[] }>(
        `/api/subjects${q}`
      );
    },
    get: (slug: string) =>
      request<{ subject: import("@/types").Subject }>(`/api/subjects/${slug}`),
    getTopic: (subjectSlug: string, topicSlug: string) =>
      request<{ topic: import("@/types").TopicDetail }>(
        `/api/subjects/${subjectSlug}/topics/${topicSlug}`
      ),
    getArticle: (
      subjectSlug: string,
      topicSlug: string,
      articleSlug: string
    ) =>
      request<{
        article: import("@/types").ArticleDetail;
        progress: import("@/types").Progress;
        starred: boolean;
        navigation: {
          prev: { slug: string; title: string } | null;
          next: { slug: string; title: string } | null;
        };
        userPlan: string;
        isPremium: boolean;
      }>(
        `/api/subjects/${subjectSlug}/topics/${topicSlug}/articles/${articleSlug}`
      ),
    getArticlePdfUrl: (
      subjectSlug: string,
      topicSlug: string,
      articleSlug: string
    ) =>
      request<PresignedPdf>(
        `/api/subjects/${subjectSlug}/topics/${topicSlug}/articles/${articleSlug}/pdf-url`
      ),
    getArticlePdfBlob: async (
      subjectSlug: string,
      topicSlug: string,
      articleSlug: string
    ) => {
      const { url } = await api.subjects.getArticlePdfUrl(
        subjectSlug,
        topicSlug,
        articleSlug
      );
      return fetchStorageBlob(url);
    },
  },

  highlights: {
    list: (articleId: string) =>
      request<{ highlights: import("@/types").Highlight[] }>(
        `/api/highlights/${articleId}`
      ),
    create: (data: {
      articleId: string;
      text: string;
      startOffset: number;
      endOffset: number;
      color?: string;
      note?: string;
    }) =>
      request<{ highlight: import("@/types").Highlight }>("/api/highlights", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: { note?: string | null }) =>
      request<{ highlight: import("@/types").Highlight }>(
        `/api/highlights/${id}`,
        { method: "PATCH", body: JSON.stringify(data) }
      ),
    delete: (id: string) =>
      request<{ success: boolean }>(`/api/highlights/${id}`, {
        method: "DELETE",
      }),
  },

  progress: {
    update: (
      articleId: string,
      data: { completed?: boolean; readPercent?: number }
    ) =>
      request<{ progress: import("@/types").Progress }>(
        `/api/progress/${articleId}`,
        { method: "POST", body: JSON.stringify(data) }
      ),
    toggleStar: (articleId: string) =>
      request<{ starred: boolean }>(`/api/progress/${articleId}/star`, {
        method: "POST",
      }),
    summary: () =>
      request<{
        completedCount: number;
        totalPublished: number;
        starredCount: number;
        overallPercent: number;
        progressBySubject: import("@/types").SubjectProgress[];
      }>("/api/progress/summary"),
  },

  admin: {
    stats: () =>
      request<{
        stats: import("@/types").AdminStats;
        recentTopics: import("@/types").AdminArticle[];
      }>("/api/admin/stats"),
    hierarchy: () =>
      request<{ subjects: import("@/types").Subject[] }>(
        "/api/admin/hierarchy"
      ),
    upload: (formData: FormData) =>
      request<{ article: import("@/types").ArticleSummary; message: string }>(
        "/api/admin/upload",
        { method: "POST", body: formData }
      ),
    listTopics: () =>
      request<{ topics: import("@/types").AdminArticle[] }>(
        "/api/admin/topics"
      ),
    updateTopic: (
      id: string,
      data: {
        title?: string;
        status?: string;
        order?: number;
        isPremium?: boolean;
        previewPercent?: number;
      }
    ) =>
      request<{ topic: import("@/types").AdminArticle }>(
        `/api/admin/topics/${id}`,
        { method: "PATCH", body: JSON.stringify(data) }
      ),
    reprocessTopic: (id: string) =>
      request<{ success: boolean; status: string }>(
        `/api/admin/topics/${id}/reprocess`,
        { method: "POST" }
      ),
    deleteTopic: (id: string) =>
      request<{ success: boolean }>(`/api/admin/topics/${id}`, {
        method: "DELETE",
      }),
  },

  subscription: {
    status: () =>
      request<{
        plan: string;
        isPremium: boolean;
        subscriptionExpiresAt: string | null;
        priceInr: number;
        planDays: number;
      }>("/api/subscription/status"),
    createOrder: () =>
      request<{
        orderId: string;
        amount: number;
        currency: string;
        keyId: string;
        name: string;
        description: string;
        prefill: { name: string; email: string };
      }>("/api/subscription/create-order", { method: "POST" }),
    verify: (data: {
      orderId: string;
      paymentId: string;
      signature: string;
    }) =>
      request<{ success: boolean; plan: string; subscriptionExpiresAt: string }>(
        "/api/subscription/verify",
        { method: "POST", body: JSON.stringify(data) }
      ),
  },

  myContent: {
    getLastRead: () =>
      request<{
        last: import("@/lib/tabViewState").LastRead | null;
        notebooks: Record<string, import("@/lib/tabViewState").LastRead>;
      }>("/api/my-content/last-read"),
    listSubjects: (opts?: {
      page?: number;
      pageSize?: number;
      q?: string;
      sort?: string;
      filter?: string;
    }) => {
      const sp = new URLSearchParams();
      if (opts?.page) sp.set("page", String(opts.page));
      if (opts?.pageSize) sp.set("pageSize", String(opts.pageSize));
      if (opts?.q) sp.set("q", opts.q);
      if (opts?.sort) sp.set("sort", opts.sort);
      if (opts?.filter) sp.set("filter", opts.filter);
      const qs = sp.toString();
      return request<{
        subjects: import("@/types").UserSubject[];
        rootPages: import("@/types").UserPageSummary[];
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
      }>(`/api/my-content/subjects${qs ? `?${qs}` : ""}`);
    },
    getSubject: (slug: string) =>
      request<{ subject: import("@/types").UserSubject }>(
        `/api/my-content/subjects/slug/${encodeURIComponent(slug)}`
      ),
    createSubject: (data: { name: string; description?: string; icon?: string }) =>
      request<{ subject: import("@/types").UserSubject }>(
        "/api/my-content/subjects",
        { method: "POST", body: JSON.stringify(data) }
      ),
    deleteSubject: (id: string) =>
      request<{ success: boolean }>(`/api/my-content/subjects/${id}`, {
        method: "DELETE",
      }),
    updateSubject: (
      id: string,
      data: { name?: string; description?: string | null; icon?: string }
    ) =>
      request<{ subject: import("@/types").UserSubject }>(
        `/api/my-content/subjects/${id}`,
        { method: "PATCH", body: JSON.stringify(data) }
      ),
    createTopicGroup: (subjectId: string, data: { title: string }) =>
      request<{ topicGroup: import("@/types").UserTopicGroup }>(
        `/api/my-content/subjects/${subjectId}/topic-groups`,
        { method: "POST", body: JSON.stringify(data) }
      ),
    deleteTopicGroup: (subjectId: string, groupId: string) =>
      request<{ success: boolean }>(
        `/api/my-content/subjects/${subjectId}/topic-groups/${groupId}`,
        { method: "DELETE" }
      ),
    updateTopicGroup: (
      subjectId: string,
      groupId: string,
      data: { title: string }
    ) =>
      request<{ topicGroup: { id: string; title: string; slug: string } }>(
        `/api/my-content/subjects/${subjectId}/topic-groups/${groupId}`,
        { method: "PATCH", body: JSON.stringify(data) }
      ),
    uploadFile: (
      subjectId: string,
      topicGroupId: string,
      formData: FormData,
      onProgress?: UploadProgressHandler
    ) => {
      const { file, title } = fileFromForm(formData);
      return uploadLibraryFile(
        file,
        title,
        { subjectId, topicGroupId },
        onProgress
      );
    },
    uploadNotebookFile: (
      subjectId: string,
      formData: FormData,
      onProgress?: UploadProgressHandler
    ) => {
      const { file, title } = fileFromForm(formData);
      return uploadLibraryFile(file, title, { subjectId }, onProgress);
    },
    uploadRootFile: (
      formData: FormData,
      onProgress?: UploadProgressHandler
    ) => {
      const { file, title } = fileFromForm(formData);
      return uploadLibraryFile(file, title, {}, onProgress);
    },
    createPage: (
      subjectId: string,
      topicGroupId: string,
      data: { title: string; htmlContent?: string; sourceUrl?: string }
    ) =>
      request<{ page: import("@/types").UserPageSummary }>(
        `/api/my-content/subjects/${subjectId}/topic-groups/${topicGroupId}/pages`,
        { method: "POST", body: JSON.stringify(data) }
      ),
    createNotebookPage: (
      subjectId: string,
      data: { title: string; htmlContent?: string; sourceUrl?: string }
    ) =>
      request<{ page: import("@/types").UserPageSummary }>(
        `/api/my-content/subjects/${subjectId}/pages`,
        { method: "POST", body: JSON.stringify(data) }
      ),
    createRootPage: (data: {
      title: string;
      htmlContent?: string;
      sourceUrl?: string;
    }) =>
      request<{ page: import("@/types").UserPageSummary }>(
        `/api/my-content/pages`,
        { method: "POST", body: JSON.stringify(data) }
      ),
    getPage: (notebookSlug: string, topicSlug: string, pageSlug: string) =>
      request<{
        page: import("@/types").UserPageDetail;
        navigation: {
          prev: { slug: string; title: string } | null;
          next: { slug: string; title: string } | null;
        };
        context: {
          notebookSlug: string | null;
          topicSlug: string | null;
        };
      }>(
        `/api/my-content/subjects/${notebookSlug}/topics/${topicSlug}/pages/${pageSlug}`
      ),
    getRootPage: (pageSlug: string) =>
      request<{
        page: import("@/types").UserPageDetail;
        navigation: {
          prev: { slug: string; title: string } | null;
          next: { slug: string; title: string } | null;
        };
        context: {
          notebookSlug: string | null;
          topicSlug: string | null;
        };
      }>(`/api/my-content/file/${encodeURIComponent(pageSlug)}`),
    getNotebookFilePage: (notebookSlug: string, pageSlug: string) =>
      request<{
        page: import("@/types").UserPageDetail;
        navigation: {
          prev: { slug: string; title: string } | null;
          next: { slug: string; title: string } | null;
        };
        context: {
          notebookSlug: string | null;
          topicSlug: string | null;
        };
      }>(
        `/api/my-content/subjects/${encodeURIComponent(notebookSlug)}/file/${encodeURIComponent(pageSlug)}`
      ),
    /** Legacy 2-segment path */
    getPageLegacy: (notebookSlug: string, pageSlug: string) =>
      request<{
        page: import("@/types").UserPageDetail;
        navigation: {
          prev: { slug: string; title: string } | null;
          next: { slug: string; title: string } | null;
        };
        context: {
          notebookSlug: string | null;
          topicSlug: string | null;
        };
      }>(`/api/my-content/subjects/${notebookSlug}/pages/${pageSlug}`),
    deletePage: (id: string) =>
      request<{ success: boolean }>(`/api/my-content/pages/${id}`, {
        method: "DELETE",
      }),
    updatePageTitle: (id: string, title: string) =>
      request<{ page: { id: string; title: string } }>(
        `/api/my-content/pages/${id}/title`,
        { method: "PATCH", body: JSON.stringify({ title }) }
      ),
    updateProgress: (
      id: string,
      data: {
        completed?: boolean;
        readPercent?: number;
        view?: {
          pdfPage?: number;
          pageOffset?: number;
          scrollTop?: number;
          scale?: number;
        };
      }
    ) =>
      request<{
        topic: {
          id: string;
          completed: boolean;
          readPercent: number;
          starred: boolean;
        };
      }>(`/api/my-content/pages/${id}/progress`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    toggleStar: (id: string) =>
      request<{ id: string; starred: boolean }>(
        `/api/my-content/pages/${id}/star`,
        { method: "POST" }
      ),
    updateContent: (id: string, htmlContent: string) =>
      request<{ success: boolean; content: string }>(
        `/api/my-content/pages/${id}/content`,
        { method: "PATCH", body: JSON.stringify({ htmlContent }) }
      ),
    updateSource: (
      id: string,
      data: { sourceUrl: string; title?: string }
    ) =>
      request<{
        success: boolean;
        sourceUrl: string;
        title: string;
      }>(`/api/my-content/pages/${id}/source`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    /** Fetch a LINK URL and store as PDF/HTML in Shelf. */
    importLink: (id: string) =>
      request<{
        page: import("@/types").UserPageSummary;
        message?: string;
      }>(`/api/my-content/pages/${id}/import`, { method: "POST" }),
    embedStatus: (id: string) =>
      request<{ embeddable: boolean; finalUrl: string | null }>(
        `/api/my-content/pages/${id}/embed-status`
      ),
    getPdfUrl: (id: string) =>
      request<PresignedPdf>(`/api/my-content/pages/${id}/pdf-url`),
    getPdfBlob: async (id: string) => {
      const { url } = await api.myContent.getPdfUrl(id);
      return fetchStorageBlob(url);
    },
    /** Overwrite a library PDF after client-side page deletes. */
    replacePdfPages: async (
      id: string,
      file: Blob,
      opts: { deletedPages: number[]; numPagesBefore: number }
    ) => {
      const init = await request<{
        uploadUrl: string;
        headers: { "Content-Type": string };
        token: string;
      }>(`/api/my-content/pages/${id}/pdf/replace/init`, {
        method: "POST",
        body: JSON.stringify({
          size: file.size,
          deletedPages: opts.deletedPages,
          numPagesBefore: opts.numPagesBefore,
        }),
      });
      await putToUrl(
        init.uploadUrl,
        file,
        init.headers["Content-Type"] || "application/pdf"
      );
      return request<{
        success: boolean;
        fileSizeBytes: number;
        highlights: import("@/types").UserContentHighlight[];
      }>(`/api/my-content/pages/${id}/pdf/replace/complete`, {
        method: "POST",
        body: JSON.stringify({ token: init.token }),
      });
    },
    /** Restore a prior PDF snapshot (session undo after page delete). */
    restorePdfPages: async (
      id: string,
      file: Blob,
      opts: {
        highlights: import("@/types").UserContentHighlight[];
        viewPdfPage?: number;
      }
    ) => {
      const init = await request<{
        uploadUrl: string;
        headers: { "Content-Type": string };
        token: string;
      }>(`/api/my-content/pages/${id}/pdf/replace/init`, {
        method: "POST",
        body: JSON.stringify({
          size: file.size,
          restore: true,
        }),
      });
      await putToUrl(
        init.uploadUrl,
        file,
        init.headers["Content-Type"] || "application/pdf"
      );
      return request<{
        success: boolean;
        fileSizeBytes: number;
        highlights: import("@/types").UserContentHighlight[];
      }>(`/api/my-content/pages/${id}/pdf/replace/complete`, {
        method: "POST",
        body: JSON.stringify({
          token: init.token,
          highlights: opts.highlights,
          viewPdfPage: opts.viewPdfPage,
        }),
      });
    },
    listHighlights: (topicId: string) =>
      request<{ highlights: import("@/types").UserContentHighlight[] }>(
        `/api/my-content/pages/${topicId}/highlights`
      ),
    createHighlight: (data: {
      userTopicId: string;
      text: string;
      startOffset?: number;
      endOffset?: number;
      color?: string;
      note?: string;
      kind?: "TEXT" | "REGION";
      pageNumber?: number;
      position?: {
        rects?: Array<{ x: number; y: number; w: number; h: number }>;
        type?: "pen";
        tool?: "ink" | "highlight";
        color?: string;
        points?: Array<{ x: number; y: number }>;
        width?: number;
        opacity?: number;
      };
    }) =>
      request<{ highlight: import("@/types").UserContentHighlight }>(
        "/api/my-content/highlights",
        { method: "POST", body: JSON.stringify(data) }
      ),
    updateHighlight: (id: string, data: { note?: string | null }) =>
      request<{ highlight: import("@/types").UserContentHighlight }>(
        `/api/my-content/highlights/${id}`,
        { method: "PATCH", body: JSON.stringify(data) }
      ),
    deleteHighlight: (id: string) =>
      request<{ success: boolean }>(`/api/my-content/highlights/${id}`, {
        method: "DELETE",
      }),
  },

  study: {
    ask: (data: {
      articleId?: string;
      userTopicId?: string;
      mode?: "ask" | "summarize" | "notes" | "mindmap";
      question?: string;
      selection?: string;
      imageBase64?: string;
      persist?: boolean;
      threadId?: string;
      history?: Array<{
        role: "user" | "assistant";
        content: string;
        imageBase64?: string;
      }>;
    }) =>
      request<{
        answer: string;
        mode: string;
        memoryLimit?: number;
        threadId?: string | null;
      }>("/api/study/ask", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    /**
     * Prefer SSE streaming; if the stream route is missing/broken on the host
     * (common right after a frontend-only deploy), fall back to JSON /ask.
     */
    askStream: async (
      data: {
        articleId?: string;
        userTopicId?: string;
        mode?: "ask" | "summarize" | "notes" | "mindmap";
        question?: string;
        selection?: string;
        imageBase64?: string;
        persist?: boolean;
        threadId?: string;
        history?: Array<{
          role: "user" | "assistant";
          content: string;
          imageBase64?: string;
        }>;
      },
      handlers: StudySseHandlers & { signal?: AbortSignal } = {}
    ) => {
      const askFallback = async () => {
        handlers.onStatus?.("generating", "Writing answer…");
        const result = await request<{
          answer: string;
          mode: string;
          memoryLimit?: number;
          threadId?: string | null;
        }>("/api/study/ask", {
          method: "POST",
          body: JSON.stringify(data),
          signal: handlers.signal,
        });
        if (result.answer) handlers.onDelta?.(result.answer);
        handlers.onDone?.(result as unknown as Record<string, unknown>);
      };

      await postStudySse("/api/study/ask/stream", data, handlers, askFallback);
    },
    libraryAsk: (data: { query: string }) =>
      request<{
        answer: string;
        matchCount: number;
        citations?: import("@/types").LibraryCitation[];
      }>("/api/study/library-ask", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    listChats: (opts?: { pageId?: string }) =>
      request<{ threads: import("@/types").ChatThreadSummary[] }>(
        opts?.pageId
          ? `/api/study/chats?pageId=${encodeURIComponent(opts.pageId)}`
          : "/api/study/chats"
      ),
    createChat: (data?: { title?: string }) =>
      request<{ thread: import("@/types").ChatThreadSummary }>(
        "/api/study/chats",
        { method: "POST", body: JSON.stringify(data ?? {}) }
      ),
    getChat: (id: string) =>
      request<{
        thread: import("@/types").ChatThread & { memoryLimit?: number };
      }>(`/api/study/chats/${id}`),
    deleteChat: (id: string) =>
      request<{ success: boolean }>(`/api/study/chats/${id}`, {
        method: "DELETE",
      }),
    sendChatMessage: (
      id: string,
      content: string,
      opts?: { imageBase64?: string }
    ) =>
      request<{
        userMessage: import("@/types").ChatMessage;
        assistantMessage: import("@/types").ChatMessage;
        title: string;
        matchCount: number;
        memoryLimit?: number;
      }>(`/api/study/chats/${id}/messages`, {
        method: "POST",
        body: JSON.stringify({ content, imageBase64: opts?.imageBase64 }),
      }),
    sendChatMessageStream: async (
      id: string,
      content: string,
      opts: {
        imageBase64?: string;
        signal?: AbortSignal;
        onStatus?: StudySseHandlers["onStatus"];
        onDelta?: StudySseHandlers["onDelta"];
        onDone?: StudySseHandlers["onDone"];
      } = {}
    ) => {
      const body = { content, imageBase64: opts.imageBase64 };
      const handlers: StudySseHandlers & { signal?: AbortSignal } = {
        onStatus: opts.onStatus,
        onDelta: opts.onDelta,
        onDone: opts.onDone,
        signal: opts.signal,
      };
      const chatFallback = async () => {
        handlers.onStatus?.("generating", "Writing answer…");
        const result = await request<{
          userMessage: import("@/types").ChatMessage;
          assistantMessage: import("@/types").ChatMessage;
          title: string;
          matchCount: number;
          memoryLimit?: number;
        }>(`/api/study/chats/${id}/messages`, {
          method: "POST",
          body: JSON.stringify(body),
          signal: opts.signal,
        });
        if (result.assistantMessage?.content) {
          handlers.onDelta?.(result.assistantMessage.content);
        }
        handlers.onDone?.(result as unknown as Record<string, unknown>);
      };
      await postStudySse(
        `/api/study/chats/${id}/messages/stream`,
        body,
        handlers,
        chatFallback
      );
    },
    updateChat: (
      id: string,
      data: {
        title?: string;
        contextKind?: import("@/types").ChatContextKind | string;
        contextNotebookId?: string | null;
        contextTopicId?: string | null;
        contextPageId?: string | null;
        relevancyDocId?: string | null;
      }
    ) =>
      request<{ thread: import("@/types").ChatThreadSummary }>(
        `/api/study/chats/${id}`,
        { method: "PATCH", body: JSON.stringify(data) }
      ),
    listRelevancyDocs: () =>
      request<{
        docs: import("@/types").StudyRelevancyDocSummary[];
        used: number;
        limit: number;
      }>("/api/study/relevancy-docs"),
    createRelevancyDoc: (data: { title: string; body: string }) =>
      request<{ doc: import("@/types").StudyRelevancyDoc }>(
        "/api/study/relevancy-docs",
        { method: "POST", body: JSON.stringify(data) }
      ),
    uploadRelevancyDoc: (formData: FormData) =>
      request<{ doc: import("@/types").StudyRelevancyDoc }>(
        "/api/study/relevancy-docs/upload",
        { method: "POST", body: formData }
      ),
    getRelevancyDoc: (id: string) =>
      request<{ doc: import("@/types").StudyRelevancyDoc }>(
        `/api/study/relevancy-docs/${id}`
      ),
    updateRelevancyDoc: (
      id: string,
      data: { title?: string; body?: string }
    ) =>
      request<{ doc: import("@/types").StudyRelevancyDoc }>(
        `/api/study/relevancy-docs/${id}`,
        { method: "PATCH", body: JSON.stringify(data) }
      ),
    deleteRelevancyDoc: (id: string) =>
      request<{ success: boolean }>(`/api/study/relevancy-docs/${id}`, {
        method: "DELETE",
      }),
  },

  tasks: {
    list: (from?: string, to?: string) => {
      const q = new URLSearchParams();
      if (from) q.set("from", from);
      if (to) q.set("to", to);
      const suffix = q.toString() ? `?${q.toString()}` : "";
      return request<{ tasks: import("@/types").StudyTask[] }>(
        `/api/tasks${suffix}`
      );
    },
    create: (data: {
      title: string;
      dueAt?: string | null;
      endsAt?: string;
      notes?: string;
      articleId?: string;
      href?: string;
      kind?: import("@/types").StudyItemKind;
      recurrence?: "NONE" | "DAILY" | "WEEKLY" | "MONTHLY";
      recurUntil?: string | null;
    }) =>
      request<{ task: import("@/types").StudyTask }>("/api/tasks", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (
      id: string,
      data: {
        title?: string;
        dueAt?: string | null;
        endsAt?: string | null;
        notes?: string;
        completed?: boolean;
        articleId?: string | null;
        href?: string | null;
        kind?: import("@/types").StudyItemKind;
        recurrence?: "NONE" | "DAILY" | "WEEKLY" | "MONTHLY";
        recurUntil?: string | null;
      }
    ) =>
      request<{ task: import("@/types").StudyTask }>(`/api/tasks/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/api/tasks/${id}`, { method: "DELETE" }),
  },
};

export function saveAuth(token: string, user: import("@/types").User) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

export function clearAuth() {
  void clearAccountLocalState();
}

export function getStoredUser(): import("@/types").User | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("user");
  return raw ? JSON.parse(raw) : null;
}
