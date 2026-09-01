import {
  ChangeMessageVisibilityCommand,
  DeleteMessageCommand,
  ReceiveMessageCommand,
} from "@aws-sdk/client-sqs";
import { dispatchIngestMessage } from "./backendClient.js";
import {
  ALL_PHASES,
  queueUrl,
  sqsClient,
  sqsConfigured,
  type Phase,
} from "./ingestConfig.js";
import { log } from "./logger.js";
import { metrics } from "./utils/metrics.js";

let processed = 0;
let failed = 0;
let lastError: string | null = null;
let lastOkAt: string | null = null;
const phaseStats: Record<Phase, { processed: number; failed: number }> = {
  POLL: { processed: 0, failed: 0 },
  FETCH: { processed: 0, failed: 0 },
  PROCESS: { processed: 0, failed: 0 },
  PROMOTE: { processed: 0, failed: 0 },
  ARCHIVE: { processed: 0, failed: 0 },
};

export function workerStats() {
  return { processed, failed, lastError, lastOkAt, phaseStats };
}

async function handleMessage(raw: string): Promise<void> {
  const msg = JSON.parse(raw) as {
    phase: Phase;
    sourceId?: string;
    itemId?: string;
    jobId?: string;
  };
  await dispatchIngestMessage(msg);
}

async function pollQueue(phase: Phase): Promise<void> {
  const url = queueUrl(phase);
  if (!url) {
    log.warn("ingest.sqs.skip", { phase, reason: "queue_unset" });
    return;
  }

  const wait = Math.min(20, Math.max(0, Number(process.env.INGEST_SQS_WAIT_SECONDS ?? 20)));
  const visibility = Number(process.env.INGEST_SQS_VISIBILITY_TIMEOUT ?? 300);

  const res = await sqsClient().send(
    new ReceiveMessageCommand({
      QueueUrl: url,
      MaxNumberOfMessages: 1,
      WaitTimeSeconds: wait,
      VisibilityTimeout: visibility,
    })
  );

  const message = res.Messages?.[0];
  if (!message?.Body || !message.ReceiptHandle) return;

  log.info("ingest.sqs.received", {
    phase,
    messageId: message.MessageId ?? "?",
    bodyPreview: message.Body.slice(0, 200),
  });

  try {
    await handleMessage(message.Body);
    await sqsClient().send(
      new DeleteMessageCommand({
        QueueUrl: url,
        ReceiptHandle: message.ReceiptHandle,
      })
    );
    processed += 1;
    phaseStats[phase].processed += 1;
    lastOkAt = new Date().toISOString();
    lastError = null;
    metrics.inc("ingest_sqs_messages_total", { phase, ok: true });
    log.info("ingest.sqs.ok", { phase, processed, failed });
  } catch (err) {
    failed += 1;
    phaseStats[phase].failed += 1;
    const msg = err instanceof Error ? err.message : String(err);
    lastError = msg;
    metrics.inc("ingest_sqs_messages_total", { phase, ok: false });
    log.error("ingest.sqs.fail", { phase, error: msg, failed, processed });

    if (/failed \((401|403|404|502|503|504)\)/.test(msg)) {
      try {
        await sqsClient().send(
          new ChangeMessageVisibilityCommand({
            QueueUrl: url,
            ReceiptHandle: message.ReceiptHandle,
            VisibilityTimeout: 30,
          })
        );
        log.warn("ingest.sqs.retry_soon", { phase, visibilitySeconds: 30 });
      } catch (visErr) {
        log.warn("ingest.sqs.visibility_failed", {
          phase,
          error: visErr instanceof Error ? visErr.message : String(visErr),
        });
      }
    }
  }
}

export async function logQueueStartup(): Promise<void> {
  const { queueStatus } = await import("./ingestConfig.js");
  const status = await queueStatus();
  log.info("ingest.sqs.queue_status", { queues: status });
}

export function startSqsWorkers(): void {
  if (!sqsConfigured()) {
    log.error("ingest.sqs.not_configured", {
      hint: "Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and all 5 INGEST_SQS_*_QUEUE_URL vars",
    });
    return;
  }

  log.info("ingest.sqs.workers_started", { phases: ALL_PHASES.join(",") });
  void logQueueStartup();

  for (const phase of ALL_PHASES) {
    const loop = async () => {
      for (;;) {
        try {
          await pollQueue(phase);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          lastError = msg;
          log.error("ingest.sqs.loop_error", { phase, error: msg });
          await new Promise((r) => setTimeout(r, 5000));
        }
      }
    };
    void loop();
  }
}

export { sqsConfigured };
