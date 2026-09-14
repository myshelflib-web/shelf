import {
  ChangeMessageVisibilityCommand,
  DeleteMessageCommand,
  ReceiveMessageCommand,
} from "@aws-sdk/client-sqs";
import { SQSClient } from "@aws-sdk/client-sqs";
import prisma from "../../utils/prisma.js";
import { errorFields, logger } from "../../utils/logger.js";
import { inactivityReminderEmail } from "./inactivityReminder.js";
import { sendEmail } from "./sendEmail.js";
import {
  getEmailQueueUrl,
  isEmailSqsConfigured,
  type EmailQueueMessage,
} from "./emailQueue.js";

let client: SQSClient | null = null;
let loopRunning = false;
let stopRequested = false;

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

function envNum(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export async function processEmailQueueMessage(
  message: EmailQueueMessage
): Promise<void> {
  if (message.type === "rendered") {
    await sendEmail({
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
    });
    return;
  }

  if (message.type === "inactivity_reminder") {
    const payload = inactivityReminderEmail({
      name: message.name,
      userId: message.userId,
    });
    await sendEmail({
      to: message.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    });
    await prisma.user.update({
      where: { id: message.userId },
      data: { lastInactivityEmailAt: new Date() },
    });
    logger.info("inactivity_email.sent", {
      userId: message.userId,
      variantId: payload.variantId,
      via: "sqs",
    });
    return;
  }

  throw new Error(`Unknown email queue message type`);
}

async function pollOnce(queueUrl: string): Promise<void> {
  const wait = Math.min(
    20,
    Math.max(0, envNum("EMAIL_SQS_WAIT_SECONDS", 20))
  );
  const visibility = envNum("EMAIL_SQS_VISIBILITY_TIMEOUT", 90);

  const res = await sqsClient().send(
    new ReceiveMessageCommand({
      QueueUrl: queueUrl,
      MaxNumberOfMessages: 5,
      WaitTimeSeconds: wait,
      VisibilityTimeout: visibility,
    })
  );

  const messages = res.Messages ?? [];
  if (messages.length === 0) return;

  for (const message of messages) {
    if (!message.Body || !message.ReceiptHandle) continue;
    try {
      const body = JSON.parse(message.Body) as EmailQueueMessage;
      await processEmailQueueMessage(body);
      await sqsClient().send(
        new DeleteMessageCommand({
          QueueUrl: queueUrl,
          ReceiptHandle: message.ReceiptHandle,
        })
      );
      logger.info("email.sqs.ok", {
        messageId: message.MessageId ?? "?",
        type: body.type,
      });
    } catch (err) {
      logger.error("email.sqs.fail", {
        messageId: message.MessageId ?? "?",
        ...errorFields(err),
      });
      try {
        await sqsClient().send(
          new ChangeMessageVisibilityCommand({
            QueueUrl: queueUrl,
            ReceiptHandle: message.ReceiptHandle,
            VisibilityTimeout: 30,
          })
        );
      } catch (visErr) {
        logger.warn("email.sqs.visibility_failed", errorFields(visErr));
      }
    }
  }
}

async function workerLoop(): Promise<void> {
  const queueUrl = getEmailQueueUrl();
  if (!queueUrl) return;

  while (!stopRequested) {
    try {
      await pollOnce(queueUrl);
    } catch (err) {
      logger.error("email.sqs.loop_error", errorFields(err));
      await new Promise((r) => setTimeout(r, 5_000));
    }
  }
  loopRunning = false;
}

/**
 * Long-poll EMAIL_SQS_QUEUE_URL and deliver via Resend.
 * Disabled when queue unset or EMAIL_SQS_WORKER=false.
 */
export function startEmailQueueWorker(): void {
  if (process.env.EMAIL_SQS_WORKER === "false") return;
  if (!isEmailSqsConfigured()) {
    logger.info("email.sqs.worker_skipped", { reason: "queue_unset" });
    return;
  }
  if (loopRunning) return;

  stopRequested = false;
  loopRunning = true;
  logger.info("email.sqs.worker_started", {
    queueUrlSet: true,
    waitSeconds: envNum("EMAIL_SQS_WAIT_SECONDS", 20),
  });
  void workerLoop();
}

export function stopEmailQueueWorker(): void {
  stopRequested = true;
}
