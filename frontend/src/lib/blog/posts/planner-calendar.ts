import { buildPost } from "../types";

export const plannerCalendar = buildPost(
  {
    slug: "planner-tasks-events-calendar",
    title: "Plan Study Tasks and Events on Shelf's Calendar",
    description:
      "Shelf planner combines tasks linked to library pages with calendar events, recurrence, and a To plan backlog. Week board and month grid views for exam prep.",
    excerpt:
      "Create tasks that open your PDFs, schedule events with external links, drag items between days, and never lose overdue work in the To plan column.",
    publishedAt: "2026-02-01",
    tags: ["planner", "calendar", "tasks", "productivity"],
    readingMinutes: 7,
  },
  [
    {
      heading: "Tasks vs events",
      paragraphs: [
        "Shelf distinguishes two planner item kinds. Tasks are in-app work: revise Chapter 4, re-read a judgment, finish a mock. Each task can link to a /my-content path so one click opens the exact page in your library.",
        "Events are calendar blocks — coaching classes, mock test days, or live streams. They support optional https links and recurrence (daily, weekly, monthly) with an end date.",
      ],
    },
    {
      heading: "Week board and month grid",
      paragraphs: [
        "The week view is a Jira-style board: seven day columns plus a To plan backlog for unscheduled items. Drag cards from backlog onto a day to schedule them.",
        "Month view shows the current month only — no scrolling through adjacent months. Each cell shows up to two items with a \"+n more\" overflow indicator. Drop onto a day to assign a due date.",
      ],
    },
    {
      heading: "Schedule reading from the reader",
      paragraphs: [
        "In any open document, tap Schedule in the bottom bar to create a task pre-linked to that page. Incomplete scheduled pages show a small calendar icon in library lists so you see what's queued for revision.",
      ],
    },
    {
      heading: "Dashboard Next up",
      paragraphs: [
        "The signed-in dashboard surfaces at most two actionable items — overdue first, then today, tomorrow, later — with a link to the full planner when you have more backlog.",
      ],
    },
  ]
);
