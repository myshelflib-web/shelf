import { metrics } from "./metrics.js";
import { estimateCostUsd, normalizeModelId, resolveTokenSplit } from "./llmPricing.js";

export type LlmFlow =
  | "study_ask"
  | "study_ask_stream"
  | "study_chat"
  | "study_map_reduce"
  | "study_tools"
  | "quiz_generate"
  | "quiz_grade"
  | "pdf_ocr"
  | "web_grounding"
  | "embedding"
  | "other";

export type EmbeddingTask = "document" | "query" | "unknown";

/** Low-cardinality route bucket for HTTP availability / latency dashboards. */
export function httpRouteGroup(path: string): string {
  if (path === "/health" || path === "/metrics") return "ops";
  if (path.startsWith("/api/auth")) return "auth";
  if (path.startsWith("/api/study")) return "study";
  if (path.startsWith("/api/quiz")) return "quiz";
  if (path.startsWith("/api/my-content")) return "library";
  if (path.startsWith("/api/tasks")) return "planner";
  if (path.startsWith("/api/subscription")) return "billing";
  if (path.startsWith("/api/telegram")) return "telegram";
  if (path.startsWith("/api/internal")) return "internal";
  if (path.startsWith("/api/admin")) return "admin";
  if (path.startsWith("/api/subjects")) return "curriculum";
  if (path.startsWith("/api/blog")) return "blog";
  if (path.startsWith("/api/affiliate")) return "affiliate";
  return "other";
}

export function httpStatusClass(status: number): string {
  if (status >= 500) return "5xx";
  if (status >= 400) return "4xx";
  if (status >= 300) return "3xx";
  if (status >= 200) return "2xx";
  return "other";
}

function modelLabel(model: string): string {
  const id = normalizeModelId(model);
  return id.length > 64 ? id.slice(0, 64) : id;
}

export function recordLlmCall(args: {
  flow: string;
  model: string;
  ok: boolean;
  stream: boolean;
  durationMs: number;
  tokens?: number;
  promptTokens?: number;
  completionTokens?: number;
  apiKeyRoute?: string;
}): void {
  const flow = args.flow || "other";
  const model = modelLabel(args.model || "unknown");
  const labels = {
    flow,
    model,
    ok: args.ok,
    stream: args.stream,
    route: args.apiKeyRoute ?? "unknown",
  };

  metrics.inc("llm_requests_total", labels);
  metrics.observe("llm_duration_ms", args.durationMs, labels);

  if (!args.ok) return;

  const split = resolveTokenSplit({
    totalTokens: args.tokens,
    promptTokens: args.promptTokens,
    completionTokens: args.completionTokens,
  });
  if (split.total <= 0) return;

  const tokenLabels = { flow, model };
  metrics.add("llm_tokens_total", split.total, { ...tokenLabels, kind: "total" });
  if (split.prompt > 0) {
    metrics.add("llm_tokens_total", split.prompt, { ...tokenLabels, kind: "prompt" });
  }
  if (split.completion > 0) {
    metrics.add("llm_tokens_total", split.completion, {
      ...tokenLabels,
      kind: "completion",
    });
  }

  const costUsd = estimateCostUsd(args.model, {
    totalTokens: split.total,
    promptTokens: split.prompt,
    completionTokens: split.completion,
  });
  if (costUsd > 0) {
    metrics.add("llm_cost_usd_total", costUsd, { flow, model });
  }
}

export function recordEmbeddingCall(args: {
  task: EmbeddingTask;
  model: string;
  ok: boolean;
  durationMs: number;
  textCount: number;
  tokenEstimate: number;
}): void {
  const task = args.task || "unknown";
  const model = modelLabel(args.model || "unknown");
  const labels = { task, model, ok: args.ok };

  metrics.inc("embedding_requests_total", labels);
  metrics.observe("embedding_duration_ms", args.durationMs, labels);

  if (!args.ok) return;

  if (args.textCount > 0) {
    metrics.add("embedding_texts_total", args.textCount, { task, model });
  }
  if (args.tokenEstimate > 0) {
    metrics.add("embedding_tokens_estimated_total", args.tokenEstimate, {
      task,
      model,
    });
    const costUsd = estimateCostUsd(model, { totalTokens: args.tokenEstimate });
    if (costUsd > 0) {
      metrics.add("embedding_cost_usd_total", costUsd, { task, model });
    }
  }
}

export function recordVectorSearch(args: {
  ok: boolean;
  durationMs: number;
  hits?: number;
}): void {
  metrics.inc("vector_search_requests_total", { ok: args.ok });
  metrics.observe("vector_search_duration_ms", args.durationMs, { ok: args.ok });
  if (args.ok && args.hits != null && args.hits > 0) {
    metrics.add("vector_search_hits_total", args.hits, { ok: true });
  }
}

export function recordVectorIndexPage(args: {
  ok: boolean;
  durationMs: number;
  chunks?: number;
}): void {
  metrics.inc("vector_index_pages_total", { ok: args.ok });
  metrics.observe("vector_index_page_duration_ms", args.durationMs, {
    ok: args.ok,
  });
  if (args.ok && args.chunks != null && args.chunks > 0) {
    metrics.add("vector_index_chunks_total", args.chunks, { ok: true });
  }
}

export function recordQuotaCharge(args: {
  flow?: string;
  tokens: number;
}): void {
  if (!Number.isFinite(args.tokens) || args.tokens <= 0) return;
  metrics.add("llm_quota_tokens_total", args.tokens, {
    flow: args.flow ?? "unknown",
  });
}

export function recordProductFlow(args: {
  domain: string;
  action: string;
  ok: boolean;
  durationMs?: number;
}): void {
  const labels = {
    domain: args.domain,
    action: args.action,
    ok: args.ok,
  };
  metrics.inc("product_flows_total", labels);
  if (args.durationMs != null && args.durationMs >= 0) {
    metrics.observe("product_flow_duration_ms", args.durationMs, labels);
  }
}
