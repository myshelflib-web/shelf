import { logger } from "../../utils/logger.js";
import { runArticleLinkHealthBatch } from "./articleLinkHealth.js";
import { runPreloadedMirrorBatch } from "./mirrorPreloadedArticle.js";

let preloadedLinkTimer: ReturnType<typeof setInterval> | null = null;

export function startPreloadedLinkHealthScheduler(): void {
  if (process.env.PRELOADED_LINK_CHECK !== "true") return;
  const intervalMs = Number(process.env.PRELOADED_LINK_CHECK_INTERVAL_MS ?? 43_200_000);
  if (preloadedLinkTimer) return;

  logger.info("preloaded.link_check.scheduler_started", {
    intervalMs,
    urlRepair: process.env.PRELOADED_URL_REPAIR === "true",
    mirrorPdf: process.env.PRELOADED_MIRROR_PDF === "true",
  });
  const tick = () => {
    void runArticleLinkHealthBatch().catch((err) =>
      logger.warn("preloaded.link_check.tick_failed", { err: String(err) })
    );
    if (process.env.PRELOADED_MIRROR_PDF === "true") {
      void runPreloadedMirrorBatch().catch((err) =>
        logger.warn("preloaded.mirror.tick_failed", { err: String(err) })
      );
    }
  };
  void tick();
  preloadedLinkTimer = setInterval(tick, intervalMs);
}
