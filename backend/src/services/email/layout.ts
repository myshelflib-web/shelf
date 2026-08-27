import { getAppUrl, getEmailLogoSrc } from "./config.js";
import { getEmailGreetingParts } from "./greeting.js";

export const BRAND = {
  bg: "#0c0c0d",
  card: "#141415",
  elevated: "#19191b",
  border: "#242426",
  borderSubtle: "#1c1c1e",
  text: "#ececee",
  muted: "#9b9ba0",
  faint: "#6e6e73",
  accent: "#6e79d6",
  accentHover: "#8b93e0",
  accentSubtle: "rgba(110, 121, 214, 0.08)",
} as const;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export type EmailLayoutOptions = {
  preheader?: string;
  title: string;
  greetingName?: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaHref?: string;
};

const EMAIL_STYLES = `
@keyframes shelf-greeting-dot {
  0%, 60%, 100% { opacity: 0.22; transform: translateY(0); }
  30% { opacity: 1; transform: translateY(-2px); }
}
.shelf-greeting-dots span {
  animation: shelf-greeting-dot 1.4s ease-in-out infinite;
}
.shelf-greeting-dots span:nth-child(2) { animation-delay: 0.2s; }
.shelf-greeting-dots span:nth-child(3) { animation-delay: 0.4s; }
@media (prefers-reduced-motion: reduce) {
  .shelf-greeting-dots span { animation: none; opacity: 0.55; }
}
`;

/** Animated dots matching the in-app GreetingBlock. */
export function greetingDotsHtml(): string {
  return `<span class="shelf-greeting-dots" aria-hidden="true" style="display: inline-flex; align-items: baseline; gap: 2px; font-size: 1.35em; line-height: 1; font-weight: 700; margin-left: 4px; letter-spacing: 0.08em; color: ${BRAND.muted};"><span style="opacity: 0.55;">.</span><span style="opacity: 0.35;">.</span><span style="opacity: 0.55;">.</span></span>`;
}

export function emailGreetingBlock(name?: string): string {
  const { salutation, firstName, subtitle } = getEmailGreetingParts(name);
  return `
<div style="margin: 0 0 24px; padding-bottom: 20px; border-bottom: 1px solid ${BRAND.borderSubtle};">
  <p style="margin: 0; font-size: 22px; line-height: 1.35; letter-spacing: -0.02em;">
    <span style="font-weight: 500; color: ${BRAND.muted}; letter-spacing: 0.02em;">${escapeHtml(salutation)},</span>
    <span style="font-weight: 600; color: ${BRAND.text};"> ${escapeHtml(firstName)}</span>${greetingDotsHtml()}
  </p>
  <p style="margin: 10px 0 0; font-size: 13px; line-height: 1.5; color: ${BRAND.faint};">${escapeHtml(subtitle)}</p>
</div>`;
}

export function detailCard(rows: { label: string; value: string }[]): string {
  const items = rows
    .map(
      (row) => `
    <tr>
      <td style="padding: 10px 0; font-size: 13px; color: ${BRAND.faint}; width: 42%; vertical-align: top;">${escapeHtml(row.label)}</td>
      <td style="padding: 10px 0; font-size: 14px; color: ${BRAND.text}; font-weight: 500; vertical-align: top;">${row.value}</td>
    </tr>`
    )
    .join("");

  return `
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 0 0 20px; background: ${BRAND.bg}; border: 1px solid ${BRAND.border}; border-radius: 10px; overflow: hidden;">
  <tr>
    <td style="padding: 4px 16px 8px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${items}</table>
    </td>
  </tr>
</table>`;
}

export function bulletList(items: string[]): string {
  const lis = items
    .map(
      (item) =>
        `<li style="margin: 0 0 8px; color: ${BRAND.muted}; font-size: 14px; line-height: 1.55;">${escapeHtml(item)}</li>`
    )
    .join("");
  return `<ul style="margin: 0 0 16px; padding-left: 20px;">${lis}</ul>`;
}

export function sectionLabel(text: string): string {
  return `<p style="margin: 0 0 10px; font-size: 12px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: ${BRAND.faint};">${escapeHtml(text)}</p>`;
}

/** Shelf-branded HTML email shell (dark theme, inline styles for clients). */
export function renderEmailLayout(opts: EmailLayoutOptions): string {
  const appUrl = getAppUrl();
  const logoSrc = getEmailLogoSrc();
  const preheader = opts.preheader ? escapeHtml(opts.preheader) : "";
  const title = escapeHtml(opts.title);
  const greeting = emailGreetingBlock(opts.greetingName);
  const cta =
    opts.ctaLabel && opts.ctaHref
      ? `
    <tr>
      <td style="padding: 8px 0 4px;">
        <a href="${escapeHtml(opts.ctaHref)}" style="display: inline-block; padding: 12px 24px; background: ${BRAND.accent}; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
          ${escapeHtml(opts.ctaLabel)}
        </a>
      </td>
    </tr>`
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="dark" />
  <title>${title}</title>
  <style>${EMAIL_STYLES}</style>
</head>
<body style="margin: 0; padding: 0; background: ${BRAND.bg}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <span style="display: none; max-height: 0; overflow: hidden; opacity: 0;">${preheader}</span>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: ${BRAND.bg}; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 520px; background: ${BRAND.card}; border: 1px solid ${BRAND.border}; border-radius: 12px; overflow: hidden;">
          <tr>
            <td style="padding: 28px 28px 16px; text-align: center; border-bottom: 1px solid ${BRAND.border};">
              <a href="${escapeHtml(appUrl)}" style="text-decoration: none; display: inline-block;">
                <img src="${escapeHtml(logoSrc)}" alt="Shelf" width="48" height="48" style="display: block; border-radius: 10px;" />
              </a>
              <div style="margin-top: 12px; font-size: 20px; font-weight: 700; color: ${BRAND.text}; letter-spacing: -0.02em;">Shelf</div>
              <div style="font-size: 13px; color: ${BRAND.muted}; margin-top: 4px;">Your personal study library</div>
            </td>
          </tr>
          <tr>
            <td style="padding: 28px; color: ${BRAND.text}; font-size: 15px; line-height: 1.6;">
              ${greeting}
              <h1 style="margin: 0 0 14px; font-size: 20px; font-weight: 700; color: ${BRAND.text}; letter-spacing: -0.02em;">${title}</h1>
              ${opts.bodyHtml}
              ${cta}
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 28px; border-top: 1px solid ${BRAND.border}; font-size: 12px; color: ${BRAND.faint}; line-height: 1.5;">
              You're receiving this email because you use Shelf.
              <br />
              <a href="${escapeHtml(appUrl)}" style="color: ${BRAND.accentHover}; text-decoration: none;">Open Shelf</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function otpCodeBlock(code: string): string {
  const cells = code
    .split("")
    .map(
      (digit) => `
      <td style="padding: 0 4px;">
        <div style="width: 44px; height: 52px; line-height: 52px; text-align: center; background: ${BRAND.bg}; border: 1px solid ${BRAND.border}; border-radius: 10px; font-size: 22px; font-weight: 700; color: ${BRAND.text}; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;">
          ${escapeHtml(digit)}
        </div>
      </td>`
    )
    .join("");

  return `
<p style="margin: 0 0 14px; font-size: 12px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: ${BRAND.faint}; text-align: center;">Verification code</p>
<table role="presentation" cellspacing="0" cellpadding="0" align="center" style="margin: 0 auto 16px;">
  <tr>${cells}</tr>
</table>
<p style="margin: 0; color: ${BRAND.faint}; font-size: 13px; line-height: 1.5; text-align: center;">Enter this 6-digit code in Shelf. It expires in <strong style="color: ${BRAND.muted};">10 minutes</strong>. If you didn't request it, you can safely ignore this email.</p>`;
}
