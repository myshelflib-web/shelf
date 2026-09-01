import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
  SQSClient,
} from "@aws-sdk/client-sqs";
import type { IngestQueueMessage } from "./types.js";
import { QUEUE_ENV_KEYS } from "./types.js";
import { dispatchIngestMessage } from "./backendClient.js";

type Phase = IngestQueueMessage["phase"];

let client: SQSClient | null = null;

function sqs(): SQSClient {
  if (!client) {
    client = new SQSClient({
      region: process.env.AWS_REGION ?? "ap-south-1",
      credentials:
        process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
          ? {
              accessKeyId: process.env.AWS_ACCESS_KEY_ID,
              secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            }
          : undefined,
    });
  }
  return client;
}

function queueUrl(phase: Phase): string | null {
  const url = process.env[QUEUE_ENV_KEYS[phase]]?.trim();
  return url || null;
}

export function sqsConfigured(): boolean {
  return (
    Boolean(queueUrl("POLL")) &&
    Boolean(queueUrl("FETCH")) &&
    Boolean(queueUrl("PROCESS"))
  );
}

async function handleMessage(raw: string): Promise<void> {
  const msg = JSON.parse(raw) as IngestQueueMessage;
  await dispatchIngestMessage(msg);
}

async function pollQueue(phase: Phase): Promise<void> {
  const url = queueUrl(phase);
  if (!url) return;

  const wait = Math.min(20, Math.max(0, Number(process.env.INGEST_SQS_WAIT_SECONDS ?? 20)));
  const visibility = Number(process.env.INGEST_SQS_VISIBILITY_TIMEOUT ?? 300);

  const res = await sqs().send(
    new ReceiveMessageCommand({
      QueueUrl: url,
      MaxNumberOfMessages: 1,
      WaitTimeSeconds: wait,
      VisibilityTimeout: visibility,
    })
  );

  const message = res.Messages?.[0];
  if (!message?.Body || !message.ReceiptHandle) return;

  try {
    await handleMessage(message.Body);
    await sqs().send(
      new DeleteMessageCommand({
        QueueUrl: url,
        ReceiptHandle: message.ReceiptHandle,
      })
    );
    console.log(`ingest.sqs.ok phase=${phase}`);
  } catch (err) {
    console.error(`ingest.sqs.fail phase=${phase}`, err);
  }
}

const PHASES: Phase[] = ["POLL", "FETCH", "PROCESS", "PROMOTE", "ARCHIVE"];

export function startSqsWorkers(): void {
  if (!sqsConfigured()) {
    console.warn("ingest.sqs.not_configured — set queue URLs or use INGEST_WORKER_MODE=poll");
    return;
  }

  console.log("ingest.sqs.workers_started", PHASES.join(","));

  for (const phase of PHASES) {
    const loop = async () => {
      for (;;) {
        try {
          await pollQueue(phase);
        } catch (err) {
          console.error(`ingest.sqs.loop_error phase=${phase}`, err);
          await new Promise((r) => setTimeout(r, 5000));
        }
      }
    };
    void loop();
  }
}
