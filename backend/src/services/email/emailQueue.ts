import {
  SQSClient,
  SendMessageCommand,
  type SendMessageCommandInput,
} from "@aws-sdk/client-sqs";
import { logger } from "../../utils/logger.js";
import { errorFields } from "../../utils/logger.js";

/** Fully rendered email ready for Resend. */
export type RenderedEmailMessage = {
  type: "rendered";
  to: string;
  subject: string;
  html: string;
  text?: string;
  meta?: {
    purpose?: string;
    userId?: string;
  };
};

/** Template rendered by the email worker (keeps SQS payload small). */
export type InactivityReminderMessage = {
  type: "inactivity_reminder";
  userId: string;
  to: string;
  name: string;
};

export type EmailQueueMessage = RenderedEmailMessage | InactivityReminderMessage;

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

export function getEmailQueueUrl(): string | null {
  return process.env.EMAIL_SQS_QUEUE_URL?.trim() || null;
}

export function isEmailSqsConfigured(): boolean {
  return Boolean(getEmailQueueUrl());
}

function messageType(message: EmailQueueMessage): string {
  return message.type;
}

/**
 * Park an outbound email on SQS for the email worker.
 * Returns MessageId, or null when the queue URL is unset.
 */
export async function enqueueEmail(
  message: EmailQueueMessage
): Promise<string | null> {
  const queueUrl = getEmailQueueUrl();
  if (!queueUrl) {
    logger.debug("email.sqs.skip", {
      reason: "queue_unset",
      type: messageType(message),
    });
    return null;
  }

  const input: SendMessageCommandInput = {
    QueueUrl: queueUrl,
    MessageBody: JSON.stringify(message),
    MessageAttributes: {
      type: { DataType: "String", StringValue: messageType(message) },
    },
  };

  if (queueUrl.endsWith(".fifo")) {
    const group =
      message.type === "inactivity_reminder"
        ? message.userId
        : message.meta?.userId ?? message.to;
    input.MessageGroupId = group.slice(0, 128);
    input.MessageDeduplicationId = [
      message.type,
      message.to,
      message.type === "inactivity_reminder"
        ? message.userId
        : message.subject.slice(0, 64),
      Date.now(),
    ]
      .join(":")
      .slice(0, 128);
  }

  try {
    const res = await sqsClient().send(new SendMessageCommand(input));
    logger.info("email.sqs.enqueued", {
      type: messageType(message),
      to: message.to,
      messageId: res.MessageId ?? null,
    });
    return res.MessageId ?? null;
  } catch (err) {
    logger.error("email.sqs.enqueue_failed", {
      type: messageType(message),
      to: message.to,
      ...errorFields(err),
    });
    throw err;
  }
}
