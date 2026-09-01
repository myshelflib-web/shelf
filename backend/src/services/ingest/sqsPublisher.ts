import {
  SQSClient,
  SendMessageCommand,
  type SendMessageCommandInput,
} from "@aws-sdk/client-sqs";
import type { IngestJobPhase } from "@prisma/client";
import { logger } from "../../utils/logger.js";

export type IngestQueuePhase = Extract<
  IngestJobPhase,
  "POLL" | "FETCH" | "PROCESS" | "PROMOTE" | "ARCHIVE"
>;

export type IngestQueueMessage = {
  phase: IngestQueuePhase;
  sourceId?: string;
  itemId?: string;
  /** Preloaded Learn article mirror (FETCH queue, no ingest item). */
  articleId?: string;
  jobId?: string;
  feedEntry?: {
    externalId: string;
    title: string;
    canonicalUrl: string;
    publishedAt?: string | null;
    description?: string | null;
  };
};

const QUEUE_ENV: Record<IngestQueuePhase, string> = {
  POLL: "INGEST_SQS_POLL_QUEUE_URL",
  FETCH: "INGEST_SQS_FETCH_QUEUE_URL",
  PROCESS: "INGEST_SQS_PROCESS_QUEUE_URL",
  PROMOTE: "INGEST_SQS_PROMOTE_QUEUE_URL",
  ARCHIVE: "INGEST_SQS_ARCHIVE_QUEUE_URL",
};

let client: SQSClient | null = null;

function sqsClient(): SQSClient {
  if (!client) {
    client = new SQSClient({
      region: process.env.AWS_REGION ?? process.env.SQS_REGION ?? "ap-south-1",
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

export function isIngestSqsConfigured(): boolean {
  return Boolean(
    process.env.INGEST_SQS_POLL_QUEUE_URL &&
      process.env.INGEST_SQS_FETCH_QUEUE_URL &&
      process.env.INGEST_SQS_PROCESS_QUEUE_URL
  );
}

export function queueUrlForPhase(phase: IngestQueuePhase): string | null {
  const url = process.env[QUEUE_ENV[phase]];
  return url?.trim() || null;
}

export async function publishIngestMessage(
  message: IngestQueueMessage
): Promise<string | null> {
  const queueUrl = queueUrlForPhase(message.phase);
  if (!queueUrl) {
    logger.debug("ingest.sqs.skip", { phase: message.phase, reason: "queue_unset" });
    return null;
  }

  const input: SendMessageCommandInput = {
    QueueUrl: queueUrl,
    MessageBody: JSON.stringify(message),
    MessageAttributes: {
      phase: { DataType: "String", StringValue: message.phase },
    },
  };

  if (message.sourceId && queueUrl.endsWith(".fifo")) {
    input.MessageGroupId = message.sourceId;
    input.MessageDeduplicationId = `${message.phase}:${message.sourceId}:${message.itemId ?? message.jobId ?? Date.now()}`;
  }

  const res = await sqsClient().send(new SendMessageCommand(input));
  return res.MessageId ?? null;
}
