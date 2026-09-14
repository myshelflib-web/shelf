export { sendEmail, sendEmailInBackground, EmailSendError } from "./sendEmail.js";
export {
  createAndSendOtp,
  verifyOtp,
  normalizeEmail,
  generateOtpCode,
  OtpInvalidError,
  OtpRateLimitError,
  OtpCooldownError,
  OTP_RESEND_COOLDOWN_MS,
} from "./otp.js";
export {
  assertDeliverableEmail,
  isValidEmailFormat,
  InvalidEmailError,
} from "./validateEmail.js";
export {
  welcomeEmail,
  subscriptionThankYouEmail,
} from "./templates.js";
export {
  inactivityReminderEmail,
  pickInactivityReminderVariant,
} from "./inactivityReminder.js";
export {
  enqueueEmail,
  isEmailSqsConfigured,
  getEmailQueueUrl,
} from "./emailQueue.js";
export { startEmailQueueWorker, stopEmailQueueWorker } from "./emailQueueWorker.js";
