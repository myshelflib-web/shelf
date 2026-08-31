import { AsyncLocalStorage } from "node:async_hooks";
import { context, trace } from "@opentelemetry/api";

export interface LogContextData {
  requestId?: string;
  traceId?: string;
  spanId?: string;
  userId?: string;
  userRole?: string;
  jobId?: string;
  method?: string;
  path?: string;
  route?: string;
  clientIp?: string;
}

const storage = new AsyncLocalStorage<LogContextData>();

export function activeTraceFields(): Pick<LogContextData, "traceId" | "spanId"> {
  const span = trace.getSpan(context.active());
  if (!span) return {};
  const spanContext = span.spanContext();
  if (!spanContext?.traceId || spanContext.traceId === "00000000000000000000000000000000") {
    return {};
  }
  return {
    traceId: spanContext.traceId,
    spanId: spanContext.spanId,
  };
}

export function runWithLogContext<T>(fields: LogContextData, fn: () => T): T {
  const parent = storage.getStore() ?? {};
  return storage.run({ ...parent, ...fields }, fn);
}

export async function runWithLogContextAsync<T>(
  fields: LogContextData,
  fn: () => Promise<T>
): Promise<T> {
  const parent = storage.getStore() ?? {};
  return storage.run({ ...parent, ...fields }, fn);
}

export function enrichLogContext(fields: LogContextData): void {
  const store = storage.getStore();
  if (!store) return;
  Object.assign(store, fields);
}

export function getLogContext(): LogContextData {
  return {
    ...(storage.getStore() ?? {}),
    ...activeTraceFields(),
  };
}
