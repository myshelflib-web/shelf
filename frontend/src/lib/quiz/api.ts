import { API_URL, ApiError } from "@/lib/api";
import { toUserFacingError } from "@/lib/userFacingError";
import type { Quiz, QuizSummary } from "./types";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    cache: "no-store",
    ...options,
    headers,
  }).catch(() => {
    throw new ApiError("Cannot reach the server.", 0);
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Request failed" }));
    throw new ApiError(
      toUserFacingError(error.error ?? "Request failed"),
      res.status
    );
  }
  return (await res.json()) as T;
}

export type CreateQuizInput = {
  sourceKind: string;
  difficulty: string;
  mcqCount: number;
  writtenCount: number;
  timeLimitSec: number | null;
  contextKind: string;
  contextNotebookId?: string | null;
  contextTopicId?: string | null;
  contextPageId?: string | null;
  relevancyDocId?: string | null;
  focusTopic?: string | null;
  sourceText?: string | null;
  file?: File | null;
};

export const quizApi = {
  list: () => request<{ quizzes: QuizSummary[] }>("/api/quiz"),
  get: (id: string) => request<{ quiz: Quiz }>(`/api/quiz/${id}`),
  create: async (input: CreateQuizInput) => {
    if (input.file) {
      const fd = new FormData();
      fd.append("sourceKind", input.sourceKind);
      fd.append("difficulty", input.difficulty);
      fd.append("mcqCount", String(input.mcqCount));
      fd.append("writtenCount", String(input.writtenCount));
      if (input.timeLimitSec) fd.append("timeLimitSec", String(input.timeLimitSec));
      fd.append("contextKind", input.contextKind);
      if (input.contextNotebookId) {
        fd.append("contextNotebookId", input.contextNotebookId);
      }
      if (input.contextTopicId) fd.append("contextTopicId", input.contextTopicId);
      if (input.contextPageId) fd.append("contextPageId", input.contextPageId);
      if (input.relevancyDocId) fd.append("relevancyDocId", input.relevancyDocId);
      if (input.focusTopic) fd.append("focusTopic", input.focusTopic);
      if (input.sourceText) fd.append("sourceText", input.sourceText);
      fd.append("file", input.file);
      return request<{ quiz: Quiz }>("/api/quiz", { method: "POST", body: fd });
    }
    return request<{ quiz: Quiz }>("/api/quiz", {
      method: "POST",
      body: JSON.stringify({
        sourceKind: input.sourceKind,
        difficulty: input.difficulty,
        mcqCount: input.mcqCount,
        writtenCount: input.writtenCount,
        timeLimitSec: input.timeLimitSec,
        contextKind: input.contextKind,
        contextNotebookId: input.contextNotebookId,
        contextTopicId: input.contextTopicId,
        contextPageId: input.contextPageId,
        relevancyDocId: input.relevancyDocId,
        focusTopic: input.focusTopic,
        sourceText: input.sourceText,
      }),
    });
  },
  retry: (id: string) =>
    request<{ quiz: Quiz }>(`/api/quiz/${id}/retry`, { method: "POST" }),
  save: (
    id: string,
    data: {
      start?: boolean;
      answers?: Array<{
        questionId: string;
        optionId?: string | null;
        text?: string | null;
      }>;
    }
  ) =>
    request<{ quiz: Quiz }>(`/api/quiz/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  submit: (id: string) =>
    request<{ quiz: Quiz }>(`/api/quiz/${id}/submit`, { method: "POST" }),
  uploadAnswerImage: (quizId: string, questionId: string, file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return request<{ quiz: Quiz }>(
      `/api/quiz/${quizId}/questions/${questionId}/image`,
      { method: "POST", body: fd }
    );
  },
  remove: (id: string) =>
    request<{ success: boolean }>(`/api/quiz/${id}`, { method: "DELETE" }),
};
