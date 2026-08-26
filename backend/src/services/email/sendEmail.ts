import { getEmailFrom, isEmailConfigured } from "./config.js";
import { getResendClient } from "./resendClient.js";
import { errorFields, logger } from "../../utils/logger.js";

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export async function sendEmail(input: SendEmailInput): Promise<void> {
  const from = getEmailFrom();
  if (!from || !isEmailConfigured()) {
    logger.warn("email.skipped", {
      reason: "Resend not configured",
      to: input.to,
      subject: input.subject,
    });
    return;
  }

  try {
    const { error } = await getResendClient().emails.send({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      ...(input.text ? { text: input.text } : {}),
    });

    if (error) {
      throw new Error(error.message || "Resend send failed");
    }

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
