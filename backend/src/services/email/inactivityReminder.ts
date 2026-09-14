import { getAppUrl } from "./config.js";
import { getDisplayFirstName, getEmailGreetingParts } from "./greeting.js";
import { bulletList, renderEmailLayout, sectionLabel } from "./layout.js";

export type InactivityReminderVariant = {
  id: string;
  subject: string;
  preheader: string;
  title: string;
  /** Optional `{name}` placeholder for the first name. */
  lead: string;
  tips: string[];
  tipsHeading: string;
  closing: string;
  ctaLabel: string;
};

/** Friendly, Shelf-voice nudges — pick one per user/week for variety. */
export const INACTIVITY_REMINDER_VARIANTS: InactivityReminderVariant[] = [
  {
    id: "awaits",
    subject: "Your Shelf awaits",
    preheader: "Your notes and PDFs are holding a spot for you.",
    title: "Your Shelf awaits",
    lead: "Been a minute, {name} — no judgment. Your library’s still here, quiet and ready whenever you are.",
    tipsHeading: "Easy ways back in",
    tips: [
      "Crack open the last PDF you were reading",
      "Ask Study AI one quick question from your notes",
      "Park a tiny planner task so tomorrow feels lighter",
    ],
    closing: "Your Shelf’s got you. Swing by when you’re ready.",
    ctaLabel: "Hop back in",
  },
  {
    id: "dusty",
    subject: "The shelves are getting a little dusty",
    preheader: "A short study stretch beats a perfect plan.",
    title: "Dust off your Shelf",
    lead: "Your collections miss you a tiny bit, {name}. Even ten focused minutes counts — no epic session required.",
    tipsHeading: "Low-effort wins",
    tips: [
      "Highlight one paragraph you actually care about",
      "Resume where you left off across devices",
      "Skim a topic and mark what’s still fuzzy",
    ],
    closing: "Small reps stack. Your Shelf’s waiting with the lights on.",
    ctaLabel: "Open my library",
  },
  {
    id: "spot",
    subject: "We saved your spot",
    preheader: "Pick up right where you left off.",
    title: "We saved your spot",
    lead: "Life got loud — fair. Your reading progress and notes didn’t wander off. They’re parked for you.",
    tipsHeading: "Pick a lane",
    tips: [
      "Jump into last-read and keep the thread going",
      "Drop a highlight so future-you thanks you",
      "Chat with Study AI about what’s stuck",
    ],
    closing: "No catch-up quiz. Just open Shelf and continue.",
    ctaLabel: "Continue studying",
  },
  {
    id: "nudge",
    subject: "Friendly nudge from your Shelf",
    preheader: "Your study library’s still in your corner.",
    title: "A friendly nudge",
    lead: "Hey {name} — just checking in. Your Shelf’s still in your corner: PDFs, notes, planner, Study AI — all yours.",
    tipsHeading: "Try one thing",
    tips: [
      "Upload or open something you’ve been meaning to revise",
      "Plan one block this week (even a short one)",
      "Ask a grounded question from a page you trust",
    ],
    closing: "We’re rooting for steady > perfect. See you inside.",
    ctaLabel: "Go to Shelf",
  },
  {
    id: "comeback",
    subject: "Your library’s holding down the fort",
    preheader: "Come back whenever — Shelf’s not going anywhere.",
    title: "Holding down the fort",
    lead: "Your Shelf didn’t pack up. Collections, highlights, and chats are still organized the way you left them.",
    tipsHeading: "Comeback kit",
    tips: [
      "Browse a collection and star what matters next",
      "Clear one overdue planner item if it’s hanging around",
      "Reopen a page and let momentum do the rest",
    ],
    closing: "Whenever you’re ready — your Shelf awaits.",
    ctaLabel: "Come back to Shelf",
  },
  {
    id: "vibe",
    subject: "Still got that study vibe?",
    preheader: "Your Shelf is ready when you are.",
    title: "Still got that study vibe?",
    lead: "No pressure, {name} — just a soft ping. Your personal study library is ready for a comeback.",
    tipsHeading: "Soft re-entry",
    tips: [
      "Open one page — that’s enough for today",
      "Let Study AI summarize a section you’re avoiding",
      "Tidy a topic so next session feels inviting",
    ],
    closing: "Catch you on the Shelf when the mood hits.",
    ctaLabel: "Open Shelf",
  },
];

function hashSeed(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) {
    h = (h * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/** ISO week string (UTC) so the same user sees a stable variant for ~7 days. */
export function inactivityWeekKey(now = new Date()): string {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function pickInactivityReminderVariant(
  userId: string,
  now = new Date()
): InactivityReminderVariant {
  const seed = hashSeed(`${userId}:${inactivityWeekKey(now)}`);
  return INACTIVITY_REMINDER_VARIANTS[seed % INACTIVITY_REMINDER_VARIANTS.length]!;
}

function greetingText(name?: string): string {
  const { salutation, firstName } = getEmailGreetingParts(name);
  return `${salutation}, ${firstName}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function fillName(template: string, firstName: string): string {
  return template.replaceAll("{name}", firstName);
}

export function inactivityReminderEmail(input: {
  name: string;
  userId: string;
  now?: Date;
}) {
  const variant = pickInactivityReminderVariant(input.userId, input.now);
  const appUrl = getAppUrl();
  const firstName = getDisplayFirstName(input.name);
  const lead = fillName(variant.lead, firstName);

  const html = renderEmailLayout({
    preheader: variant.preheader,
    title: variant.title,
    greetingName: input.name,
    bodyHtml: `
<p style="margin: 0 0 16px; color: #9b9ba0; font-size: 15px; line-height: 1.6;">${escapeHtml(lead)}</p>
${sectionLabel(variant.tipsHeading)}
${bulletList(variant.tips)}
<p style="margin: 0 0 4px; color: #9b9ba0; font-size: 14px; line-height: 1.6;">${escapeHtml(variant.closing)}</p>`,
    ctaLabel: variant.ctaLabel,
    ctaHref: `${appUrl}/my-content`,
  });

  return {
    subject: variant.subject,
    html,
    text: `${greetingText(input.name)}\n\n${variant.title}\n\n${lead}\n\n${variant.tips.map((t) => `• ${t}`).join("\n")}\n\n${variant.closing}\n${appUrl}/my-content`,
    variantId: variant.id,
  };
}
