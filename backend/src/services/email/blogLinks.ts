import { getAppUrl } from "./config.js";
import { sectionLabel } from "./layout.js";

type BlogLink = {
  slug: string;
  label: string;
  blurb: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Getting-started guides for new accounts. */
export const WELCOME_BLOG_LINKS: BlogLink[] = [
  {
    slug: "getting-started-with-shelf",
    label: "Getting started with Shelf",
    blurb: "First uploads, library structure, and Study AI",
  },
  {
    slug: "personal-study-library-collections",
    label: "Build your study library",
    blurb: "Collections, topics, and organizing PDFs",
  },
  {
    slug: "pdf-reader-highlights-annotations",
    label: "Read & highlight PDFs",
    blurb: "Annotations, notes, and smooth reopen",
  },
  {
    slug: "study-ai-ask-from-your-pdfs",
    label: "Ask Study AI from your material",
    blurb: "Questions grounded in what you uploaded",
  },
];

/** Power features for Premium subscribers. */
export const PREMIUM_BLOG_LINKS: BlogLink[] = [
  {
    slug: "study-ai-library-wide-chat",
    label: "Library-wide Study AI chat",
    blurb: "Multi-turn chat across your collections",
  },
  {
    slug: "reader-workspace-tabs-split-view",
    label: "Reader tabs & split view",
    blurb: "Compare sources side by side",
  },
  {
    slug: "cross-device-reading-progress",
    label: "Cross-device reading sync",
    blurb: "Resume the same page on any device",
  },
  {
    slug: "shelf-premium-subscription",
    label: "Get the most from Premium",
    blurb: "Storage, tokens, and vector search limits",
  },
];

export function blogLinksHtml(links: BlogLink[], heading = "Explore what you can do"): string {
  const appUrl = getAppUrl();
  const rows = links
    .map(
      (link) => `
    <tr>
      <td style="padding: 10px 0; border-bottom: 1px solid #1c1c1e;">
        <a href="${escapeHtml(`${appUrl}/blog/${link.slug}`)}" style="color: #8b93e0; font-weight: 600; font-size: 14px; text-decoration: none;">${escapeHtml(link.label)}</a>
        <div style="font-size: 13px; color: #6e6e73; margin-top: 3px; line-height: 1.45;">${escapeHtml(link.blurb)}</div>
      </td>
    </tr>`
    )
    .join("");

  return `
${sectionLabel(heading)}
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 0 0 12px; background: #0c0c0d; border: 1px solid #242426; border-radius: 10px; overflow: hidden;">
  <tr>
    <td style="padding: 4px 16px 8px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${rows}</table>
    </td>
  </tr>
</table>
<p style="margin: 0 0 16px; font-size: 13px; line-height: 1.5;">
  <a href="${escapeHtml(`${appUrl}/blog`)}" style="color: #8b93e0; text-decoration: none; font-weight: 500;">Browse all Shelf feature guides →</a>
</p>`;
}

export function blogLinksText(links: BlogLink[]): string {
  const appUrl = getAppUrl();
  const lines = links.map(
    (link) => `• ${link.label}: ${appUrl}/blog/${link.slug}`
  );
  return `\nExplore what you can do:\n${lines.join("\n")}\nAll guides: ${appUrl}/blog\n`;
}
