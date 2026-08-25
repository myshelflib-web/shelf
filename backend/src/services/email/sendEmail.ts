import { SendEmailCommand } from "@aws-sdk/client-ses";
import { getSesFromEmail, isSesConfigured } from "./config.js";
import { getSesClient } from "./sesClient.js";
import { errorFields, logger } from "../../utils/logger.js";

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export async function sendEmail(input: SendEmailInput): Promise<void> {
  const from = getSesFromEmail();
  if (!from || !isSesConfigured()) {
    logger.warn("email.skipped", {
      reason: "SES not configured",
      to: input.to,
      subject: input.subject,
    });
    return;
  }

  try {
    await getSesClient().send(
      new SendEmailCommand({
        Source: from,
        Destination: { ToAddresses: [input.to] },
        Message: {
          Subject: { Data: input.subject, Charset: "UTF-8" },
          Body: {
            Html: { Data: input.html, Charset: "UTF-8" },
            ...(input.text
              ? { Text: { Data: input.text, Charset: "UTF-8" } }
              : {}),
          },
        },
      })
    );
    logger.info("email.sent", { to: input.to, subject: input.subject });
  } catch (err) {
    logger.error("email.failed", {
      to: input.to,
      subject: input.subject,
      ...errorFields(err),
    });
    throw err;
  }
}

/** Fire-and-forget — auth/payment responses must not wait on email delivery. */
export function sendEmailInBackground(input: SendEmailInput): void {
  void sendEmail(input).catch(() => {
    /* logged in sendEmail */
  });
}
