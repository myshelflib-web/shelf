export type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function resolveLevel(): LogLevel {
  const raw = (process.env.LOG_LEVEL ?? "info").toLowerCase();
  if (raw === "debug" || raw === "info" || raw === "warn" || raw === "error") {
    return raw;
  }
  return "info";
}

function shouldLog(level: LogLevel): boolean {
  return LEVEL_ORDER[level] >= LEVEL_ORDER[resolveLevel()];
}

export interface LogFields {
  [key: string]: unknown;
}

function write(level: LogLevel, message: string, fields?: LogFields): void {
  if (!shouldLog(level)) return;

  const entry = {
    ts: new Date().toISOString(),
    level,
    service: process.env.SERVICE_NAME ?? "processing-service",
    msg: message,
    ...fields,
  };

  const line = JSON.stringify(entry);
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  debug: (message: string, fields?: LogFields) => write("debug", message, fields),
  info: (message: string, fields?: LogFields) => write("info", message, fields),
  warn: (message: string, fields?: LogFields) => write("warn", message, fields),
  error: (message: string, fields?: LogFields) => write("error", message, fields),
  child: (base: LogFields) => ({
    debug: (message: string, fields?: LogFields) =>
      write("debug", message, { ...base, ...fields }),
    info: (message: string, fields?: LogFields) =>
      write("info", message, { ...base, ...fields }),
    warn: (message: string, fields?: LogFields) =>
      write("warn", message, { ...base, ...fields }),
    error: (message: string, fields?: LogFields) =>
      write("error", message, { ...base, ...fields }),
  }),
};

export function errorFields(err: unknown): LogFields {
  if (err instanceof Error) {
    return {
      errName: err.name,
      errMessage: err.message,
      errStack: err.stack,
    };
  }
  return { errMessage: String(err) };
}
