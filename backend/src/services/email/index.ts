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
