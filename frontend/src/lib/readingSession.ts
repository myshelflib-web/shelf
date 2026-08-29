import { isReaderHref } from "@/lib/softNavigate";

export const READING_HEARTBEAT_MS = 30_000;
export const READING_MAX_FLUSH_SECONDS = 120;

export function shouldCountReading(opts: {
  active: boolean;
  href: string;
  visibilityState: DocumentVisibilityState | string;
}): boolean {
  return (
    opts.active &&
    opts.visibilityState === "visible" &&
    isReaderHref(opts.href)
  );
}

export type ReadingSession = {
  start: () => void;
  stop: () => void;
  isRunning: () => boolean;
};

export function createReadingSession(options: {
  commit: (seconds: number) => void;
  now?: () => number;
  setIntervalFn?: (fn: () => void, ms: number) => number;
  clearIntervalFn?: (id: number) => void;
  heartbeatMs?: number;
  maxFlushSeconds?: number;
}): ReadingSession {
  const now = options.now ?? Date.now;
  const setIntervalFn = options.setIntervalFn ?? window.setInterval.bind(window);
  const clearIntervalFn =
    options.clearIntervalFn ?? window.clearInterval.bind(window);
  const heartbeatMs = options.heartbeatMs ?? READING_HEARTBEAT_MS;
  const maxFlushSeconds = options.maxFlushSeconds ?? READING_MAX_FLUSH_SECONDS;

  let running = false;
  let startedAt = 0;
  let heartbeatId: number | null = null;

  const flush = () => {
    if (!running) return;
    const elapsedMs = now() - startedAt;
    const seconds = Math.floor(elapsedMs / 1000);
    if (seconds <= 0) return;
    if (seconds > maxFlushSeconds) {
      options.commit(maxFlushSeconds);
      startedAt = now();
      return;
    }
    options.commit(seconds);
    startedAt += seconds * 1000;
  };

  const start = () => {
    if (running) return;
    running = true;
    startedAt = now();
    heartbeatId = setIntervalFn(flush, heartbeatMs);
  };

  const stop = () => {
    if (!running) return;
    flush();
    running = false;
    if (heartbeatId != null) {
      clearIntervalFn(heartbeatId);
      heartbeatId = null;
    }
  };

  return {
    start,
    stop,
    isRunning: () => running,
  };
}
