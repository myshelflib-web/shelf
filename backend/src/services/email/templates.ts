import { getAppUrl } from "./config.js";
import {
  blogLinksHtml,
  blogLinksText,
  PREMIUM_BLOG_LINKS,
  WELCOME_BLOG_LINKS,
} from "./blogLinks.js";
import { getDisplayFirstName, getEmailGreetingParts } from "./greeting.js";
import {
  bulletList,
  detailCard,
  otpCodeBlock,
  renderEmailLayout,
  sectionLabel,
} from "./layout.js";

function greetingText(name?: string): string {
  const { salutation, firstName } = getEmailGreetingParts(name);
  return `${salutation}, ${firstName}`;
}

function escapeEmail(email: string): string {
  return email.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function signupOtpEmail(name: string | undefined, code: string, email: string) {
  const subject = "Verify your email — Shelf";
  const html = renderEmailLayout({
    preheader: `Your Shelf verification code is ${code}`,
    title: "Verify your email",
    greetingName: name,
    bodyHtml: `
<p style="margin: 0 0 16px; color: #9b9ba0; font-size: 15px; line-height: 1.6;">You're almost in. Confirm your email to finish creating your Shelf account.</p>
${detailCard([
  { label: "Email", value: escapeEmail(email) },
  { label: "Account", value: name?.trim() ? escapeEmail(name.trim()) : "New Shelf user" },
  { label: "Code expires", value: "10 minutes" },
])}
${otpCodeBlock(code)}`,
  });
  return {
    subject,
    html,
    text: `${greetingText(name)}\n\nVerify ${email}\nYour code: ${code}\nExpires in 10 minutes.`,
  };
}

export function passwordResetOtpEmail(name: string | undefined, code: string, email: string) {
  const subject = "Reset your password — Shelf";
  const html = renderEmailLayout({
    preheader: `Your Shelf password reset code is ${code}`,
    title: "Reset your password",
    greetingName: name,
    bodyHtml: `
<p style="margin: 0 0 16px; color: #9b9ba0; font-size: 15px; line-height: 1.6;">We received a request to reset the password for your Shelf account. Use the code below to choose a new password.</p>
${detailCard([
  { label: "Email", value: escapeEmail(email) },
  { label: "Requested", value: "Password reset" },
  { label: "Code expires", value: "10 minutes" },
])}
${otpCodeBlock(code)}
<p style="margin: 16px 0 0; color: #6e6e73; font-size: 13px; line-height: 1.5;">Didn't ask for this? Your password stays the same — no action needed.</p>`,
    ctaLabel: "Reset password",
    ctaHref: `${getAppUrl()}/forgot-password`,
  });
  return {
    subject,
    html,
    text: `${greetingText(name)}\n\nReset code for ${email}: ${code}\nExpires in 10 minutes.`,
  };
}

export function welcomeEmail(name: string) {
  const appUrl = getAppUrl();
  const firstName = getDisplayFirstName(name);
  const subject = "Welcome to Shelf";
  const html = renderEmailLayout({
    preheader: "Your study library is ready — start adding PDFs and notes.",
    title: "Welcome aboard",
    greetingName: name,
    bodyHtml: `
<p style="margin: 0 0 16px; color: #9b9ba0; font-size: 15px; line-height: 1.6;">Your Shelf account is ready, ${escapeEmail(firstName)}. Here’s what you can do from day one:</p>
${sectionLabel("Your library")}
${bulletList([
  "Organize PDFs and notes into collections and topics",
  "Highlight, annotate, and pick up where you left off on any device",
  "Plan study sessions and tasks in the planner",
  "Ask Study AI questions grounded in your own library",
])}
${detailCard([
  { label: "Plan", value: "Free — 100 MB storage" },
  { label: "Study AI", value: "50k tokens / month" },
  { label: "Next step", value: "Add your first PDF or note" },
])}
${blogLinksHtml(WELCOME_BLOG_LINKS, "Guides to get started")}
<p style="margin: 0; color: #9b9ba0; font-size: 14px;">We're glad you're here — happy studying!</p>`,
    ctaLabel: "Go to my library",
    ctaHref: `${appUrl}/my-content`,
  });
  return {
    subject,
    html,
    text: `${greetingText(name)}\n\nWelcome to Shelf! ${appUrl}/my-content${blogLinksText(WELCOME_BLOG_LINKS)}`,
  };
}

export function subscriptionThankYouEmail(
  name: string,
  expiresAt: Date,
  planDays: number,
  amountInr?: number
) {
  const appUrl = getAppUrl();
  const expiry = expiresAt.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const subject = "Thank you for subscribing to Shelf Premium";
  const html = renderEmailLayout({
    preheader: "Your Premium subscription is active. Thank you for supporting Shelf!",
    title: "Thank you for going Premium",
    greetingName: name,
    bodyHtml: `
<p style="margin: 0 0 16px; color: #9b9ba0; font-size: 15px; line-height: 1.6;">Your payment went through and Shelf Premium is now active on your account. Wishing you focused, productive study sessions ahead!</p>
${sectionLabel("Subscription details")}
${detailCard([
  { label: "Plan", value: "Shelf Premium" },
  ...(amountInr != null
    ? [{ label: "Amount paid", value: `₹${(amountInr / 100).toLocaleString("en-IN")}` }]
    : []),
  { label: "Duration", value: `${planDays} days` },
  { label: "Active until", value: expiry },
])}
${sectionLabel("Premium includes")}
${bulletList([
  "10 GB storage for PDFs and notes",
  "2 million Study AI tokens per month",
  "10,000 indexed library chunks for deeper search",
  "300 chat messages per Study AI thread",
])}
${blogLinksHtml(PREMIUM_BLOG_LINKS, "Make the most of Premium")}
<p style="margin: 0; color: #9b9ba0; font-size: 14px;">Thank you for supporting Shelf — it means a lot to us.</p>`,
    ctaLabel: "Start studying",
    ctaHref: `${appUrl}/my-content`,
  });
  return {
    subject,
    html,
    text: `${greetingText(name)}\n\nPremium active until ${expiry}. Thank you! ${appUrl}/my-content${blogLinksText(PREMIUM_BLOG_LINKS)}`,
  };
}
