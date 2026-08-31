import { AnalyticsEvents } from "./events";
import { captureException, track } from "./client";

export type ClientErrorKind =
  | "js_error"
  | "unhandled_rejection"
  | "component_error"
  | "api_request_failed"
  | "chunk_load_failed";

const DEDUPE_MS = 10_000;
const recentKeys = new Map<string, number>();

function scrub(value: string, max = 500): string {
  return value
    .replace(/Bearer\s+\S+/gi, "Bearer [redacted]")
    .replace(/phc_[a-zA-Z0-9]+/g, "phc_[redacted]")
    .slice(0, max);
}

function pageContext(): { url: string; route: string } {
  if (typeof window === "undefined") {
    return { url: "", route: "" };
  }
  const url = window.location.href;
  return { url, route: `${window.location.pathname}${window.location.search}` };
}

function shouldReport(key: string): boolean {
  const now = Date.now();
  const last = recentKeys.get(key);
  if (last != null && now - last < DEDUPE_MS) return false;
  recentKeys.set(key, now);
  if (recentKeys.size > 200) {
    for (const [k, ts] of recentKeys) {
      if (now - ts > DEDUPE_MS * 3) recentKeys.delete(k);
    }
  }
  return true;
}

function eventForKind(kind: ClientErrorKind): string {
  switch (kind) {
    case "api_request_failed":
      return AnalyticsEvents.apiRequestFailed;
    case "component_error":
      return AnalyticsEvents.componentError;
    case "chunk_load_failed":
      return AnalyticsEvents.chunkLoadFailed;
    default:
      return AnalyticsEvents.clientError;
  }
}

export function isChunkLoadMessage(message: string): boolean {
  return /loading chunk|chunkloaderror|dynamically imported module|importing a module script failed/i.test(
    message
  );
}

export type CaptureClientErrorInput = {
  kind: ClientErrorKind;
  message: string;
  stack?: string;
  name?: string;
  /** API path or logical surface (e.g. study_sse). */
  path?: string;
  method?: string;
  status?: number;
  requestId?: string;
  componentStack?: string;
  source?: string;
};

/** Report a client-side issue to PostHog (+ native exception capture when enabled). */
export function captureClientError(input: CaptureClientErrorInput): void {
  if (typeof window === "undefined") return;

  const message = scrub(input.message || "Unknown client error");
  const dedupeKey = [
    input.kind,
    input.path ?? "",
    String(input.status ?? ""),
    message.slice(0, 120),
  ].join("|");
  if (!shouldReport(dedupeKey)) return;

  const { url, route } = pageContext();
  const props = {
    kind: input.kind,
    message,
    name: input.name ? scrub(input.name, 120) : undefined,
    stack: input.stack ? scrub(input.stack, 2000) : undefined,
    path: input.path,
    method: input.method,
    status: input.status,
    request_id: input.requestId,
    component_stack: input.componentStack
      ? scrub(input.componentStack, 2000)
      : undefined,
    source: input.source,
    url,
    route,
  };

  track(eventForKind(input.kind), props);

  if (input.kind !== "api_request_failed") {
    const err = new Error(message);
    if (input.name) err.name = input.name;
    if (input.stack) err.stack = input.stack;
    captureException(err, props);
  }
}

export function reportApiFailure(args: {
  path: string;
  method?: string;
  status: number;
  message: string;
  requestId?: string;
  source?: string;
}): void {
  captureClientError({
    kind: "api_request_failed",
    message: args.message,
    path: args.path,
    method: args.method ?? "GET",
    status: args.status,
    requestId: args.requestId,
    source: args.source ?? "api",
  });
}

export function captureComponentError(
  error: Error,
  componentStack?: string
): void {
  captureClientError({
    kind: "component_error",
    message: error.message,
    name: error.name,
    stack: error.stack,
    componentStack,
  });
}

/** Global window error + unhandledrejection listeners (call once on app mount). */
export function installClientErrorMonitoring(): () => void {
  if (typeof window === "undefined") return () => undefined;

  const onError = (event: ErrorEvent) => {
    const message = event.message || "Script error";
    if (isChunkLoadMessage(message)) {
      captureClientError({
        kind: "chunk_load_failed",
        message,
        stack: event.error instanceof Error ? event.error.stack : undefined,
        source: event.filename || undefined,
      });
      return;
    }
    captureClientError({
      kind: "js_error",
      message,
      name: event.error instanceof Error ? event.error.name : "Error",
      stack: event.error instanceof Error ? event.error.stack : undefined,
      source: event.filename || undefined,
    });
  };

  const onRejection = (event: PromiseRejectionEvent) => {
    const reason = event.reason;
    const message =
      reason instanceof Error
        ? reason.message
        : typeof reason === "string"
          ? reason
          : "Unhandled promise rejection";
    const kind = isChunkLoadMessage(message)
      ? "chunk_load_failed"
      : "unhandled_rejection";
    captureClientError({
      kind,
      message,
      name: reason instanceof Error ? reason.name : undefined,
      stack: reason instanceof Error ? reason.stack : undefined,
    });
  };

  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onRejection);
  return () => {
    window.removeEventListener("error", onError);
    window.removeEventListener("unhandledrejection", onRejection);
  };
}
