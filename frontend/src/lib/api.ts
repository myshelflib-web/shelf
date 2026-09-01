import { clearAccountLocalState } from "@/lib/accountLocalState";
import { compressFormDataFiles, compressUploadFile, shouldCompressUpload } from "@/lib/compressUploadFile";
import { fetchWithRetry } from "@/lib/fetchRetry";
import { reportApiFailure } from "@/lib/analytics/errors";
import { toUserStudyAiError } from "@/lib/studyAiErrors";
import { toUserFacingError } from "@/lib/userFacingError";

/** Production (Vercel): set NEXT_PUBLIC_API_URL to the Render backend, e.g. https://your-api.onrender.com */
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  readonly status: number;
  readonly retryAfterSec?: number;

  constructor(message: string, status: number, retryAfterSec?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.retryAfterSec = retryAfterSec;
  }
}

export function isNetworkError(err: unknown): boolean {
  return err instanceof ApiError && err.status === 0;
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

function newRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "x-request-id": newRequestId(),
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const requestId = headers["x-request-id"];

  const res = await fetchWithRetry(`${API_URL}${path}`, {
    cache: "no-store",
    ...options,
    headers,
  }).catch(() => {
    const message = toUserFacingError(
      "Cannot reach the server. Check that the backend is running and NEXT_PUBLIC_API_URL is correct.",
      "Couldn’t reach the server. Check your connection and try again."
    );
    reportApiFailure({
      path,
      method: options.method ?? "GET",
      status: 0,
      message,
      requestId,
    });
    throw new ApiError(message, 0);
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Request failed" }));
    const retryAfterSec =
      typeof error.retryAfterSec === "number" ? error.retryAfterSec : undefined;
    const message = toUserFacingError(error.error ?? "Request failed");
    reportApiFailure({
      path,
      method: options.method ?? "GET",
      status: res.status,
      message,
      requestId,
    });
    throw new ApiError(message, res.status, retryAfterSec);
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
  phase?: "compressing" | "uploading";
};

export type UploadProgressHandler = (progress: UploadProgress) => void;

export type PresignedPdf = {
  url: string;
  version: string;
  expiresIn: number;
};

async function fetchStorageBlob(url: string): Promise<Blob> {
  const res = await fetchWithRetry(url).catch(() => {
    const message = toUserFacingError(
      "Cannot reach storage. Check that MinIO/R2 is running and bucket CORS allows this site.",
      "Could not load this file. Please try again."
    );
    reportApiFailure({
      path: "storage_blob",
      method: "GET",
      status: 0,
      message,
      source: "storage",
    });
    throw new ApiError(message, 0);
  });
  if (!res.ok) {
    reportApiFailure({
      path: "storage_blob",
      method: "GET",
      status: res.status,
      message: "Could not load PDF",
      source: "storage",
    });
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
      onProgress({ loaded, total, percent, phase: "uploading" });
    };

    xhr.upload.onload = () => {
      onProgress?.({
        loaded: body.size,
        total: body.size,
        percent: 100,
        phase: "uploading",
      });
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
  if (shouldCompressUpload(file)) {
    onProgress?.({
      loaded: 0,
      total: file.size,
      percent: 0,
      phase: "compressing",
    });
  }
  const toUpload = await compressUploadFile(file);
  const init = await request<{
    uploadUrl: string;
    headers: { "Content-Type": string };
    token: string;
  }>("/api/my-content/uploads/init", {
    method: "POST",
    body: JSON.stringify({
      title,
      filename: toUpload.name,
      contentType: toUpload.type,
      size: toUpload.size,
      subjectId: scope.subjectId,
      topicGroupId: scope.topicGroupId,
    }),
  });
  await putToUrl(
    init.uploadUrl,
    toUpload,
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
        streamError = toUserStudyAiError(
          payload.message ?? "Study AI failed"
        );
        handlers.onDone?.(payload);
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
  const requestId = newRequestId();
  let res: Response;
  try {
    res = await fetchWithRetry(`${API_URL}${path}`, {
      method: "POST",
      cache: "no-store",
      signal: handlers.signal,
      retrySafeMethods: false,
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        "x-request-id": requestId,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
  } catch {
    reportApiFailure({
      path,
      method: "POST",
      status: 0,
      message: "Study AI stream network error",
      requestId,
      source: "study_sse",
    });
    await fallback();
    return;
  }

  if (!res.ok || !res.body) {
    const raw = await res.text().catch(() => "");
    const detail = parseSseErrorBody(raw);
    reportApiFailure({
      path,
      method: "POST",
      status: res.ok ? 0 : res.status,
      message: detail || `Study AI failed (HTTP ${res.status})`,
      requestId,
      source: "study_sse",
    });
    if ([404, 405, 501, 502, 503].includes(res.status)) {
      try {
        await fallback();
        return;
      } catch (fallbackErr) {
        throw new Error(
          toUserStudyAiError(
            fallbackErr instanceof Error
              ? fallbackErr
              : detail || `Study AI failed (HTTP ${res.status})`
          )
        );
      }
    }
    throw new Error(
      toUserStudyAiError(
        detail || `Study AI failed (HTTP ${res.status}). Check backend logs.`
      )
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
    register: (email: string, password: string, name: string, otp: string) =>
      request<{ user: import("@/types").User; token: string }>(
        "/api/auth/register",
        { method: "POST", body: JSON.stringify({ email, password, name, otp }) }
      ),
    sendRegisterOtp: (email: string, name?: string) =>
      request<{ ok: boolean; message: string }>("/api/auth/register/send-otp", {
        method: "POST",
        body: JSON.stringify({ email, name }),
      }),
    sendPasswordResetOtp: (email: string) =>
      request<{ ok: boolean; message: string }>(
        "/api/auth/forgot-password/send-otp",
        { method: "POST", body: JSON.stringify({ email }) }
      ),
    resetPassword: (email: string, otp: string, newPassword: string) =>
      request<{ ok: boolean; message: string }>(
        "/api/auth/forgot-password/reset",
        { method: "POST", body: JSON.stringify({ email, otp, newPassword }) }
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
    uploadAvatar: async (file: File) => {
      const formData = new FormData();
      formData.append("avatar", await compressUploadFile(file));
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
    telegram: (payload: Record<string, unknown>) =>
      request<{ user: import("@/types").User; token: string }>(
        "/api/auth/telegram",
        { method: "POST", body: JSON.stringify(payload) }
      ),
  },

  telegram: {
    loginWidget: () =>
      request<{ botUsername: string | null }>("/api/telegram/login-widget"),
    status: () =>
      request<{
        configured: boolean;
        botUsername: string | null;
        linked: boolean;
        telegramUsername: string | null;
        linkedAt: string | null;
      }>("/api/telegram/status"),
    link: () =>
      request<{ url: string; expiresAt: string }>("/api/telegram/link", {
        method: "POST",
      }),
    unlink: () =>
      request<{ ok: boolean }>("/api/telegram/link", { method: "DELETE" }),
    sharePage: (pageId: string) =>
      request<{ ok: boolean; kind: "document" | "message"; title: string }>(
        "/api/telegram/share-page",
        { method: "POST", body: JSON.stringify({ pageId }) }
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
    getArticleEmbedStatus: (
      subjectSlug: string,
      topicSlug: string,
      articleSlug: string
    ) =>
      request<{
        embeddable: boolean | null;
        linkStatus: string;
        finalUrl: string | null;
      }>(
        `/api/subjects/${subjectSlug}/topics/${topicSlug}/articles/${articleSlug}/embed-status`
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
    upload: async (formData: FormData) => {
      await compressFormDataFiles(formData, ["pdf"]);
      return request<{ article: import("@/types").ArticleSummary; message: string }>(
        "/api/admin/upload",
        { method: "POST", body: formData }
      );
    },
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
    bulkImport: async (file: File) => {
      const formData = new FormData();
      formData.append("manifest", file);
      return request<{
        subjectsCreated: number;
        topicsCreated: number;
        articlesCreated: number;
        articlesUpdated: number;
        rowCount: number;
        parseErrors: Array<{ line: number; message: string }>;
        errors: Array<{ line: number; message: string }>;
        message: string;
      }>("/api/admin/bulk-import", { method: "POST", body: formData });
    },
    bulkUploadPdfs: async (files: File[]) => {
      const formData = new FormData();
      for (const f of files) {
        formData.append("pdfs", await compressUploadFile(f));
      }
      return request<{
        uploaded: string[];
        errors: Array<{ file: string; message: string }>;
        count: number;
      }>("/api/admin/bulk-upload-pdfs", { method: "POST", body: formData });
    },
    listBlogPosts: () =>
      request<{ posts: import("@/types").AdminBlogPostRow[] }>(
        "/api/admin/blog"
      ),
    getBlogPost: (id: string) =>
      request<{ post: import("@/types").AdminBlogPostDetail }>(
        `/api/admin/blog/${id}`
      ),
    createBlogPost: (data: {
      title: string;
      slug?: string;
      description: string;
      excerpt: string;
      tags?: string[];
      readingMinutes?: number;
      status?: "DRAFT" | "PUBLISHED";
      sections: import("@/types").AdminBlogSection[];
    }) =>
      request<{ post: import("@/types").AdminBlogPostRow }>("/api/admin/blog", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updateBlogPost: (
      id: string,
      data: {
        title?: string;
        slug?: string;
        description?: string;
        excerpt?: string;
        tags?: string[];
        readingMinutes?: number;
        status?: "DRAFT" | "PUBLISHED";
        sections?: import("@/types").AdminBlogSection[];
      }
    ) =>
      request<{ post: import("@/types").AdminBlogPostRow }>(
        `/api/admin/blog/${id}`,
        { method: "PATCH", body: JSON.stringify(data) }
      ),
    uploadBlogCover: async (id: string, file: File) => {
      const formData = new FormData();
      formData.append("cover", await compressUploadFile(file));
      return request<{ coverImageUrl: string }>(
        `/api/admin/blog/${id}/cover`,
        { method: "POST", body: formData }
      );
    },
    deleteBlogPost: (id: string) =>
      request<{ ok: boolean }>(`/api/admin/blog/${id}`, { method: "DELETE" }),
    ingestSources: () =>
      request<{ sources: import("@/types").IngestSourceRow[] }>(
        "/api/admin/ingest/sources"
      ),
    ingestSeedSources: () =>
      request<{ created: number; updated: number }>(
        "/api/admin/ingest/seed-sources",
        { method: "POST" }
      ),
    preloadedSeedCatalog: () =>
      request<{ created: number; updated: number }>(
        "/api/admin/preloaded/seed",
        { method: "POST" }
      ),
    preloadedMigrateLinks: () =>
      request<{ updated: number }>("/api/admin/preloaded/migrate-links", {
        method: "POST",
      }),
    preloadedCheckLinks: (limit?: number) =>
      request<{ checked: number }>("/api/admin/preloaded/check-links", {
        method: "POST",
        body: JSON.stringify(limit ? { limit } : {}),
      }),
    ingestPollSource: (id: string) =>
      request<{ jobId: string; sqsMessageId: string | null }>(
        `/api/admin/ingest/sources/${id}/poll`,
        { method: "POST" }
      ),
    ingestItems: (opts?: { status?: string; limit?: number }) => {
      const params = new URLSearchParams();
      if (opts?.status) params.set("status", opts.status);
      if (opts?.limit) params.set("limit", String(opts.limit));
      const q = params.toString();
      return request<{ items: import("@/types").IngestItemRow[] }>(
        `/api/admin/ingest/items${q ? `?${q}` : ""}`
      );
    },
    ingestApproveItem: (id: string) =>
      request<{ ok: boolean }>(`/api/admin/ingest/items/${id}/approve`, {
        method: "POST",
      }),
    ingestBulkApproveItems: (opts?: {
      ids?: string[];
      status?: "PENDING_REVIEW" | "FETCHED";
      limit?: number;
    }) =>
      request<{ approved: number; failed: number; errors: string[] }>(
        "/api/admin/ingest/items/bulk-approve",
        {
          method: "POST",
          body: JSON.stringify(opts ?? {}),
        }
      ),
    ingestRejectItem: (id: string) =>
      request<{ ok: boolean }>(`/api/admin/ingest/items/${id}/reject`, {
        method: "POST",
      }),
    ingestPromoteItem: (id: string) =>
      request<{ articleId: string | null }>(
        `/api/admin/ingest/items/${id}/promote`,
        { method: "POST" }
      ),
    ingestCheckLink: (id: string) =>
      request<{
        ok: boolean;
        linkStatus: string;
        embeddable: boolean | null;
        lastHttpStatus: number | null;
        finalUrl: string;
      }>(`/api/admin/ingest/items/${id}/check-link`, { method: "POST" }),
    ingestJobs: (limit = 30) =>
      request<{ jobs: import("@/types").IngestJobRow[] }>(
        `/api/admin/ingest/jobs?limit=${limit}`
      ),
    contentGenOverview: () =>
      request<import("@/types").ContentGenOverview>(
        "/api/admin/content-gen/overview"
      ),
    contentGenJobs: (limit = 20) =>
      request<{ jobs: import("@/types").ContentGenJobRow[] }>(
        `/api/admin/content-gen/jobs?limit=${limit}`
      ),
    contentGenJob: (id: string) =>
      request<{ job: import("@/types").ContentGenJobDetail }>(
        `/api/admin/content-gen/jobs/${id}`
      ),
    contentGenJobItems: (
      id: string,
      opts?: { cursor?: string; limit?: number }
    ) => {
      const params = new URLSearchParams();
      if (opts?.cursor) params.set("cursor", opts.cursor);
      if (opts?.limit) params.set("limit", String(opts.limit));
      const q = params.toString();
      return request<import("@/types").ContentGenItemsPage>(
        `/api/admin/content-gen/jobs/${id}/items${q ? `?${q}` : ""}`
      );
    },
    contentGenResume: (id: string) =>
      request<{ ok: true }>(`/api/admin/content-gen/jobs/${id}/resume`, {
        method: "POST",
      }),
    contentGenStarterPack: (body: {
      studyGoal: import("@/types").StudyGoal;
      subjectSlug?: string;
      limit?: number;
      dryRun?: boolean;
      skipExisting?: boolean;
    }) =>
      request<{ jobId: string; plannedCount: number }>(
        "/api/admin/content-gen/starter-pack",
        { method: "POST", body: JSON.stringify(body) }
      ),
    contentGenNewsPlan: (body: {
      studyGoal: import("@/types").StudyGoal;
      limit?: number;
      windowDays?: number;
      minSources?: number;
    }) =>
      request<{
        totalItems: number;
        clusters: import("@/types").ContentGenNewsCluster[];
      }>("/api/admin/content-gen/news/plan", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    contentGenNews: (body: {
      studyGoal: import("@/types").StudyGoal;
      limit?: number;
      windowDays?: number;
      minSources?: number;
      dryRun?: boolean;
    }) =>
      request<{ jobId: string; plannedCount: number }>(
        "/api/admin/content-gen/news",
        { method: "POST", body: JSON.stringify(body) }
      ),
  },

  currentAffairs: {
    list: (opts?: {
      goal?: import("@/types").StudyGoal;
      from?: string;
      to?: string;
      limit?: number;
    }) => {
      const params = new URLSearchParams();
      if (opts?.goal) params.set("goal", opts.goal);
      if (opts?.from) params.set("from", opts.from);
      if (opts?.to) params.set("to", opts.to);
      if (opts?.limit) params.set("limit", String(opts.limit));
      const q = params.toString();
      return request<{
        goal: import("@/types").StudyGoal;
        from: string;
        to: string;
        items: import("@/types").CurrentAffairsItem[];
      }>(`/api/current-affairs${q ? `?${q}` : ""}`);
    },
    get: (slug: string) =>
      request<{ item: import("@/types").CurrentAffairsItem }>(
        `/api/current-affairs/items/${encodeURIComponent(slug)}`
      ),
    embedStatus: (slug: string) =>
      request<{
        slug: string;
        url: string;
        embeddable: boolean | null;
        linkStatus: string;
        lastHttpStatus: number | null;
        lastLinkCheckAt: string | null;
      }>(`/api/current-affairs/items/${encodeURIComponent(slug)}/embed-status`),
  },

  subscription: {
    status: () =>
      request<{
        plan: string;
        isPremium: boolean;
        subscriptionExpiresAt: string | null;
        coinBalance: number;
        priceInr: number;
        planDays: number;
        plans: {
          once: { amountPaise: number; priceInr: number; planDays: number; label: string };
          monthly: { amountPaise: number; priceInr: number; planDays: number; label: string };
          yearly: { amountPaise: number; priceInr: number; planDays: number; label: string };
        };
        recurring: {
          id: string;
          interval: string;
          status: string;
          amount: number;
          currentPeriodEnd: string | null;
          cancelAtPeriodEnd: boolean;
        } | null;
      }>("/api/subscription/status"),
    preview: (data: {
      interval?: string;
      couponCode?: string;
      applyCoins?: boolean;
    }) =>
      request<{
        interval: string;
        planDays: number;
        label: string;
        listAmount: number;
        couponDiscount: number;
        coinsApplied: number;
        chargeAmount: number;
        fullyCoveredByCredit: boolean;
        couponCode: string | null;
        coinBalance: number;
      }>("/api/subscription/preview", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    createOrder: (data?: {
      couponCode?: string;
      affiliateCode?: string;
      applyCoins?: boolean;
      interval?: string;
    }) =>
      request<{
        orderId?: string;
        amount: number;
        currency?: string;
        keyId?: string;
        name?: string;
        description?: string;
        prefill?: { name: string; email: string };
        listAmount?: number;
        couponDiscount?: number;
        coinsApplied?: number;
        freeActivation?: boolean;
        success?: boolean;
        plan?: string;
        subscriptionExpiresAt?: string;
      }>("/api/subscription/create-order", {
        method: "POST",
        body: JSON.stringify(data ?? {}),
      }),
    verify: (data: {
      orderId: string;
      paymentId: string;
      signature: string;
    }) =>
      request<{ success: boolean; plan: string; subscriptionExpiresAt: string }>(
        "/api/subscription/verify",
        { method: "POST", body: JSON.stringify(data) }
      ),
    createSubscription: (data: {
      interval: "MONTHLY" | "YEARLY";
      couponCode?: string;
      affiliateCode?: string;
    }) =>
      request<{
        subscriptionId: string;
        keyId: string;
        name: string;
        description: string;
        prefill: { name: string; email: string };
        interval: string;
        amount: number;
        currency: string;
        recurring: boolean;
      }>("/api/subscription/create-subscription", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    verifySubscription: (data: {
      subscriptionId: string;
      paymentId: string;
      signature: string;
    }) =>
      request<{
        success: boolean;
        plan: string;
        subscriptionExpiresAt: string;
        recurring: boolean;
      }>("/api/subscription/verify-subscription", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    cancelSubscription: () =>
      request<{ ok: boolean; cancelAtPeriodEnd: boolean }>(
        "/api/subscription/cancel-subscription",
        { method: "POST" }
      ),
  },

  affiliate: {
    me: () =>
      request<{
        code: string;
        coinBalance: number;
        commissionPercent: number;
        attributionDays: number;
        totalEarnedCoins: number;
        referralCount: number;
        recent: {
          id: string;
          amountCoins: number;
          createdAt: string;
          referredName: string;
        }[];
      }>("/api/affiliate/me"),
  },

  adminCoupons: {
    list: () =>
      request<{
        coupons: {
          id: string;
          code: string;
          type: "PERCENT" | "FIXED";
          value: number;
          maxUses: number | null;
          maxUsesPerUser: number;
          usedCount: number;
          validFrom: string | null;
          validUntil: string | null;
          active: boolean;
          minAmount: number | null;
          createdAt: string;
        }[];
      }>("/api/admin/coupons"),
    create: (data: Record<string, unknown>) =>
      request<{ coupon: { id: string } }>("/api/admin/coupons", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Record<string, unknown>) =>
      request<{ coupon: { id: string } }>(`/api/admin/coupons/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    deactivate: (id: string) =>
      request<{ ok: boolean }>(`/api/admin/coupons/${id}`, { method: "DELETE" }),
    affiliates: () =>
      request<{
        affiliates: {
          code: string;
          createdAt: string;
          user: {
            id: string;
            name: string;
            email: string;
            coinBalance: number;
          };
          totalEarnedCoins: number;
          referralCount: number;
        }[];
      }>("/api/admin/coupons/affiliates/summary"),
  },

  myContent: {
    getLastRead: () =>
      request<{
        last: import("@/lib/tabViewState").LastRead | null;
        notebooks: Record<string, import("@/lib/tabViewState").LastRead>;
      }>("/api/my-content/last-read"),
    /** Unified folder/file tree (new model). Legacy listSubjects still works. */
    getLibraryTree: () =>
      request<import("@/types/library").LibraryTreeResponse>(
        "/api/my-content/tree"
      ),
    listFolders: (parentId?: string | null) => {
      const sp = new URLSearchParams();
      if (parentId) sp.set("parentId", parentId);
      const qs = sp.toString();
      return request<{ folders: import("@/types/library").LibraryFolder[] }>(
        `/api/my-content/folders${qs ? `?${qs}` : ""}`
      );
    },
    createFolder: (data: {
      name: string;
      parentId?: string | null;
      description?: string;
      icon?: string;
    }) =>
      request<{ folder: import("@/types/library").LibraryFolder }>(
        "/api/my-content/folders",
        { method: "POST", body: JSON.stringify(data) }
      ),
    listFiles: (folderId?: string | null) => {
      const sp = new URLSearchParams();
      if (folderId) sp.set("folderId", folderId);
      const qs = sp.toString();
      return request<{ files: import("@/types/library").LibraryFile[] }>(
        `/api/my-content/files${qs ? `?${qs}` : ""}`
      );
    },
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
    bulkDelete: (data: {
      subjectIds?: string[];
      topicGroups?: { subjectId: string; groupId: string }[];
      pageIds?: string[];
    }) =>
      request<{ success: boolean }>("/api/my-content/bulk-delete", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    reorderSubjects: (orderedIds: string[]) =>
      request<{ success: boolean }>("/api/my-content/subjects/reorder", {
        method: "PATCH",
        body: JSON.stringify({ orderedIds }),
      }),
    reorderTopicGroups: (subjectId: string, orderedIds: string[]) =>
      request<{ success: boolean }>(
        `/api/my-content/subjects/${subjectId}/topic-groups/reorder`,
        { method: "PATCH", body: JSON.stringify({ orderedIds }) }
      ),
    movePage: (
      pageId: string,
      data: {
        subjectId: string | null;
        topicGroupId: string | null;
        beforePageId?: string | null;
      }
    ) =>
      request<{
        page: import("@/types").UserPageSummary;
        subjectId: string | null;
        topicGroupId: string | null;
      }>(`/api/my-content/pages/${pageId}/move`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    moveTopicGroup: (
      sourceSubjectId: string,
      groupId: string,
      data: { targetSubjectId: string; beforeGroupId?: string | null }
    ) =>
      request<{
        topicGroup: import("@/types").UserTopicGroup;
        sourceSubjectId: string;
        targetSubjectId: string;
      }>(
        `/api/my-content/subjects/${sourceSubjectId}/topic-groups/${groupId}/move`,
        { method: "PATCH", body: JSON.stringify(data) }
      ),
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
    importYoutube: (data: {
      sourceUrl: string;
      title?: string;
      notebookId?: string;
      topicId?: string;
    }) =>
      request<{
        kind: "video" | "playlist";
        page: import("@/types").UserPageSummary;
        pages: import("@/types").UserPageSummary[];
        href: string;
        notebook: { id: string; name: string; slug: string } | null;
        topic: { id: string; title: string; slug: string } | null;
        importedCount: number;
        truncated: boolean;
        playlistTitle: string | null;
      }>("/api/my-content/youtube", {
        method: "POST",
        body: JSON.stringify(data),
      }),
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
    getPageById: (id: string, linkToken?: string | null) => {
      const qs = linkToken ? `?t=${encodeURIComponent(linkToken)}` : "";
      return request<{
        page: import("@/types").UserPageDetail;
        navigation: {
          prev: { slug: string; title: string } | null;
          next: { slug: string; title: string } | null;
        };
        context: {
          notebookSlug: string | null;
          topicSlug: string | null;
          shared?: boolean;
        };
        access: import("@/types").PageAccessInfo;
      }>(`/api/my-content/pages/${encodeURIComponent(id)}${qs}`);
    },
    listShares: (pageId: string) =>
      request<{
        owner: {
          id: string;
          name: string;
          email: string;
          avatarUrl: string | null;
        };
        shares: Array<{
          id: string;
          email: string;
          role: "view" | "edit";
          status: string;
          pending: boolean;
          user: {
            id: string;
            name: string;
            email: string;
            avatarUrl: string | null;
          } | null;
        }>;
        generalAccess: "restricted" | "link";
        linkToken: string | null;
        linkPath: string | null;
      }>(`/api/my-content/pages/${encodeURIComponent(pageId)}/shares`),
    saveShares: (
      pageId: string,
      data: {
        people: Array<{ email: string; role: "view" | "edit" }>;
        generalAccess: "restricted" | "link";
      }
    ) =>
      request<{
        owner: {
          id: string;
          name: string;
          email: string;
          avatarUrl: string | null;
        };
        shares: Array<{
          id: string;
          email: string;
          role: "view" | "edit";
          status: string;
          pending: boolean;
          user: {
            id: string;
            name: string;
            email: string;
            avatarUrl: string | null;
          } | null;
        }>;
        generalAccess: "restricted" | "link";
        linkToken: string | null;
        linkPath: string | null;
      }>(`/api/my-content/pages/${encodeURIComponent(pageId)}/shares`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    listSharedWithMe: () =>
      request<{
        unread: number;
        items: Array<{
          shareId: string;
          pageId: string;
          title: string;
          contentType: string;
          role: "view" | "edit";
          status: "active" | "removed";
          href: string;
          owner: {
            id: string;
            name: string;
            email: string;
            avatarUrl: string | null;
          };
          unread: boolean;
          copiedPageId: string | null;
          updatedAt: string;
        }>;
      }>("/api/my-content/shared-with-me"),
    hideSharedItem: (shareId: string) =>
      request<{ ok: boolean }>(
        `/api/my-content/shared-with-me/${encodeURIComponent(shareId)}/hide`,
        { method: "POST" }
      ),
    lookupUsers: (q: string) =>
      request<{
        users: Array<{
          id: string;
          name: string;
          email: string;
          avatarUrl: string | null;
          onShelf: boolean;
        }>;
      }>(`/api/my-content/users/lookup?q=${encodeURIComponent(q)}`),
    saveSharedCopy: (
      pageId: string,
      data?: { subjectId?: string; topicGroupId?: string; t?: string }
    ) =>
      request<{
        page: { id: string; title: string; slug: string; contentType: string };
      }>(`/api/my-content/pages/${encodeURIComponent(pageId)}/save-copy`, {
        method: "POST",
        body: JSON.stringify(data ?? {}),
      }),
    saveCurriculumArticle: (data: {
      subjectSlug: string;
      topicSlug: string;
      articleSlug: string;
    }) =>
      request<{
        page: { id: string; title: string; slug: string; contentType: string };
        href: string;
        alreadySaved: boolean;
        status: string;
        saveMode?: "copy_admin" | "download_remote" | "link" | "none";
        saveReason?: string;
      }>("/api/my-content/from-curriculum", {
        method: "POST",
        body: JSON.stringify(data),
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
    getPdfUrl: (id: string, linkToken?: string | null) => {
      const qs = linkToken ? `?t=${encodeURIComponent(linkToken)}` : "";
      return request<PresignedPdf>(
        `/api/my-content/pages/${id}/pdf-url${qs}`
      );
    },
    getPdfBlob: async (id: string, linkToken?: string | null) => {
      const { url } = await api.myContent.getPdfUrl(id, linkToken);
      return fetchStorageBlob(url);
    },
    /** Overwrite a library PDF after client-side page deletes. */
    replacePdfPages: async (
      id: string,
      file: Blob,
      opts: { deletedPages: number[]; numPagesBefore: number }
    ) => {
      const packed = await compressUploadFile(
        file instanceof File
          ? file
          : new File([file], "source.pdf", { type: "application/pdf" })
      );
      const init = await request<{
        uploadUrl: string;
        headers: { "Content-Type": string };
        token: string;
      }>(`/api/my-content/pages/${id}/pdf/replace/init`, {
        method: "POST",
        body: JSON.stringify({
          size: packed.size,
          deletedPages: opts.deletedPages,
          numPagesBefore: opts.numPagesBefore,
        }),
      });
      await putToUrl(
        init.uploadUrl,
        packed,
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
    listHighlights: (topicId: string, linkToken?: string | null) => {
      const qs = linkToken ? `?t=${encodeURIComponent(linkToken)}` : "";
      return request<{ highlights: import("@/types").UserContentHighlight[] }>(
        `/api/my-content/pages/${topicId}/highlights${qs}`
      );
    },
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
      mode?: "ask" | "summarize" | "notes" | "mindmap" | "deep-summary" | "analyze";
      depth?: "quick" | "standard" | "deep";
      question?: string;
      selection?: string;
      imageBase64?: string;
      persist?: boolean;
      threadId?: string;
      webSearch?: boolean;
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
        mode?: "ask" | "summarize" | "notes" | "mindmap" | "deep-summary" | "analyze";
        depth?: "quick" | "standard" | "deep";
        question?: string;
        prompt?: string;
        selection?: string;
        imageBase64?: string;
        persist?: boolean;
        threadId?: string;
        history?: Array<{
          role: "user" | "assistant";
          content: string;
          imageBase64?: string;
        }>;
        webSearch?: boolean;
      },
      handlers: StudySseHandlers & { signal?: AbortSignal } = {}
    ) => {
      const askFallback = async () => {
        handlers.onStatus?.("generating", "Composing answer");
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
    deleteChatMessage: (chatId: string, messageId: string) =>
      request<{ success: boolean; deletedIds: string[] }>(
        `/api/study/chats/${chatId}/messages/${messageId}`,
        { method: "DELETE" }
      ),
    /** Cursor-style edit: drop from a user message (or keep first N) onward. */
    truncateChatMessages: (
      chatId: string,
      opts: { messageId?: string; keepCount?: number }
    ) =>
      request<{ success: boolean; deletedIds: string[] }>(
        `/api/study/chats/${chatId}/messages/truncate`,
        {
          method: "POST",
          body: JSON.stringify(opts),
        }
      ),
    sendChatMessage: (
      id: string,
      content: string,
      opts?: { imageBase64?: string; prompt?: string; depth?: "quick" | "standard" | "deep"; webSearch?: boolean }
    ) =>
      request<{
        userMessage: import("@/types").ChatMessage;
        assistantMessage: import("@/types").ChatMessage;
        title: string;
        matchCount: number;
        memoryLimit?: number;
      }>(`/api/study/chats/${id}/messages`, {
        method: "POST",
        body: JSON.stringify({
          content,
          prompt: opts?.prompt,
          imageBase64: opts?.imageBase64,
          depth: opts?.depth,
          webSearch: opts?.webSearch,
        }),
      }),
    sendChatMessageStream: async (
      id: string,
      content: string,
      opts: {
        imageBase64?: string;
        prompt?: string;
        depth?: "quick" | "standard" | "deep";
        webSearch?: boolean;
        signal?: AbortSignal;
        onStatus?: StudySseHandlers["onStatus"];
        onDelta?: StudySseHandlers["onDelta"];
        onDone?: StudySseHandlers["onDone"];
      } = {}
    ) => {
      const body = {
        content,
        prompt: opts.prompt,
        imageBase64: opts.imageBase64,
        depth: opts.depth,
        webSearch: opts.webSearch,
      };
      const handlers: StudySseHandlers & { signal?: AbortSignal } = {
        onStatus: opts.onStatus,
        onDelta: opts.onDelta,
        onDone: opts.onDone,
        signal: opts.signal,
      };
      const chatFallback = async () => {
        handlers.onStatus?.("generating", "Composing answer");
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
    uploadRelevancyDoc: async (formData: FormData) => {
      await compressFormDataFiles(formData, ["file"]);
      return request<{ doc: import("@/types").StudyRelevancyDoc }>(
        "/api/study/relevancy-docs/upload",
        { method: "POST", body: formData }
      );
    },
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
