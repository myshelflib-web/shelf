import { fetchDueSources, postIngest } from "./backendClient.js";
import { log } from "./logger.js";

export function startLocalPollWorker(): void {
  const intervalMs = Number(process.env.INGEST_POLL_INTERVAL_MS ?? 60_000);
  log.info("ingest.poll.worker_started", { intervalMs });

  const tick = async () => {
    try {
      const sources = await fetchDueSources();
      for (const source of sources) {
        await postIngest(`/api/internal/ingest/poll/${source.id}`, {});
        log.info("ingest.poll.local", { slug: source.slug, sourceId: source.id });
      }
    } catch (err) {
      log.error("ingest.poll.local_failed", {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  };

  void tick();
  setInterval(() => void tick(), intervalMs);
}
