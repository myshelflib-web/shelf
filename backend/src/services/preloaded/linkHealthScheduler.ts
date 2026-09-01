import { logger } from "../../utils/logger.js";
import { runArticleLinkHealthBatch } from "./articleLinkHealth.js";

let preloadedLinkTimer: ReturnType<typeof setInterval> | null = null;

export function startPreloadedLinkHealthScheduler(): void {
  if (process.env.PRELOADED_LINK_CHECK !== "true") return;
  const intervalMs = Number(process.env.PRELOADED_LINK_CHECK_INTERVAL_MS ?? 43_200_000);
  if (preloadedLinkTimer) return;

  logger.info("preloaded.link_check.scheduler_started", {
    intervalMs,
    urlRepair: process.env.PRELOADED_URL_REPAIR === "true",
  });
  void runArticleLinkHealthBatch().catch((err) =>
    logger.warn("preloaded.link_check.initial_failed", { err: String(err) })
  );
  preloadedLinkTimer = setInterval(() => {
    void runArticleLinkHealthBatch().catch((err) =>
      logger.warn("preloaded.link_check.tick_failed", { err: String(err) })
    );
  }, intervalMs);
}
