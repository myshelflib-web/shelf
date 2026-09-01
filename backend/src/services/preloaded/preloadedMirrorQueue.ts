import { createIngestJob } from "../ingest/ingestJobs.js";
import { isIngestSqsConfigured, publishIngestMessage } from "../ingest/sqsPublisher.js";
import { logger } from "../../utils/logger.js";

export async function enqueuePreloadedMirror(articleId: string): Promise<string | null> {
  if (!isIngestSqsConfigured()) {
    logger.debug("preloaded.mirror.skip", { articleId, reason: "sqs_unset" });
    return null;
  }

  const job = await createIngestJob({
    phase: "FETCH",
    payload: { articleId, kind: "preloaded_mirror" },
  });

  const messageId = await publishIngestMessage({
    phase: "FETCH",
    articleId,
    jobId: job.id,
  });

  logger.info("preloaded.mirror.enqueued", { articleId, jobId: job.id, messageId });
  return messageId;
}
