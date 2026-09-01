import { GetQueueAttributesCommand, SQSClient } from "@aws-sdk/client-sqs";
import { QUEUE_ENV_KEYS, type IngestQueueMessage } from "./types.js";

export type Phase = IngestQueueMessage["phase"];

export const ALL_PHASES: Phase[] = ["POLL", "FETCH", "PROCESS", "PROMOTE", "ARCHIVE"];

export function queueUrl(phase: Phase): string | null {
  const url = process.env[QUEUE_ENV_KEYS[phase]]?.trim();
  return url || null;
}

export function awsConfigured(): boolean {
  return Boolean(process.env.AWS_ACCESS_KEY_ID?.trim() && process.env.AWS_SECRET_ACCESS_KEY?.trim());
}

export function sqsConfigured(): boolean {
  if (!awsConfigured()) return false;
  return ALL_PHASES.every((phase) => Boolean(queueUrl(phase)));
}

export function sqsClient(): SQSClient {
  return new SQSClient({
    region: process.env.AWS_REGION ?? "ap-south-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!.trim(),
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!.trim(),
    },
  });
}

export async function queueDepth(url: string): Promise<number | null> {
  try {
    const res = await sqsClient().send(
      new GetQueueAttributesCommand({
        QueueUrl: url,
        AttributeNames: ["ApproximateNumberOfMessages"],
      })
    );
    const n = res.Attributes?.ApproximateNumberOfMessages;
    return n != null ? Number(n) : null;
  } catch {
    return null;
  }
}

export async function queueStatus(): Promise<
  Record<string, { configured: boolean; depth: number | null }>
> {
  const out: Record<string, { configured: boolean; depth: number | null }> = {};
  for (const phase of ALL_PHASES) {
    const url = queueUrl(phase);
    out[phase] = {
      configured: Boolean(url),
      depth: url ? await queueDepth(url) : null,
    };
  }
  return out;
}
