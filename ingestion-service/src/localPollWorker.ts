import { fetchDueSources, postIngest } from "./backendClient.js";

export function startLocalPollWorker(): void {
  const intervalMs = Number(process.env.INGEST_POLL_INTERVAL_MS ?? 60_000);
  console.log("ingest.poll.worker_started", { intervalMs });

  const tick = async () => {
    try {
      const sources = await fetchDueSources();
      for (const source of sources) {
        await postIngest(`/api/internal/ingest/poll/${source.id}`, {});
        console.log("ingest.poll.local", { slug: source.slug });
      }
    } catch (err) {
      console.error("ingest.poll.local_failed", err);
    }
  };

  void tick();
  setInterval(() => void tick(), intervalMs);
}
