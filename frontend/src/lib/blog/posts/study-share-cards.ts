import { buildPost } from "../types";

export const studyShareCards = buildPost(
  {
    slug: "share-study-streak-cards",
    title: "Share Study Streak Cards on Instagram and WhatsApp",
    description:
      "Export a Strava-style study streak card from Shelf — reading time, active days, and medals — sized for Instagram Stories, WhatsApp, and Telegram.",
    excerpt:
      "Tap Share streak card from the header flame or dashboard to export a dark, story-ready PNG. Toggle your study goal and today's minutes before posting.",
    publishedAt: "2026-08-29",
    tags: ["streak", "sharing", "dashboard", "social"],
    readingMinutes: 4,
  },
  [
    {
      heading: "Brag-worthy streak cards",
      paragraphs: [
        "Shelf tracks reading minutes and daily streaks while you study. When you hit a milestone — or just want to stay accountable — open the flame popover in the header and tap Share streak card.",
        "Shelf renders a polished PNG with your streak count, last-seven-days activity strip, today's reading time, total active days, and your latest streak medal. The design matches Shelf's dark study workspace so it looks native on Instagram Stories and WhatsApp status.",
      ],
    },
    {
      heading: "Story or square, with privacy toggles",
      paragraphs: [
        "Choose Story (9:16) for vertical feeds or Square for posts. Before exporting, toggle whether to show your study goal (UPSC, NEET PG, etc.) and today's reading minutes — keep details private while still sharing consistency.",
        "Share image uses your device's native share sheet when available (great on mobile). Save PNG downloads a file for manual posting. Telegram + link saves the card and opens Telegram's share picker with a Shelf landing link.",
      ],
    },
    {
      heading: "Where to find it",
      paragraphs: [
        "Header flame popover → Share streak card. Dashboard home also has a share icon beside Reading today and Streak metrics.",
        "Cards include a subtle myshelflib.com watermark for discovery — not a leaderboard, not a social feed. Your library stays private; only the stats you choose appear on the card.",
      ],
    },
  ]
);
