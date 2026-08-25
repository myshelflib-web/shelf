import { buildPost } from "../types";

export const dashboardStreak = buildPost(
  {
    slug: "study-dashboard-streak-achievements",
    title: "Dashboard, Reading Streaks, and Study Achievements",
    description:
      "Track reading minutes, maintain streaks, unlock achievements, and resume where you left off from Shelf's focused dashboard home.",
    excerpt:
      "The dashboard greets you, shows continue reading, next planner items, recent collections, and eight achievement tiles — without overwhelming empty states.",
    publishedAt: "2026-02-04",
    tags: ["dashboard", "streak", "achievements", "reading"],
    readingMinutes: 5,
  },
  [
    {
      heading: "A calm home after sign-in",
      paragraphs: [
        "Dashboard lives at /dashboard in the header nav. It is intentionally compact: greeting with rotating salutations, search and Ask AI entry points, continue reading for your last collection or page, and Next up from the planner.",
        "Recent collections appear as compact tiles — three wide, not stretched banners — so returning to active material is one click.",
      ],
    },
    {
      heading: "Reading streaks",
      paragraphs: [
        "Shelf tracks daily reading minutes locally and shows your streak in the header flame popover. Open it for a month calendar of active days and streak medals. Consistency matters more than marathon sessions; even a short read keeps the chain alive.",
      ],
    },
    {
      heading: "Achievements",
      paragraphs: [
        "Eight horizontal achievement tiles show progress (n / 8). Locked tiles appear dashed; earned ones fill with color. First session, library milestones, and streak length contribute — nudging habit without gamification noise.",
      ],
    },
    {
      heading: "First-time users",
      paragraphs: [
        "New accounts see Add material instead of empty metrics and achievement grids — the dashboard never feels broken before you upload your first PDF.",
      ],
    },
  ]
);
