import { buildPost } from "../types";

export const pwaOffline = buildPost(
  {
    slug: "pwa-offline-study-app",
    title: "Install Shelf as a PWA for Offline-Friendly Study",
    description:
      "Add Shelf to your home screen as a Progressive Web App. Offline cache for library metadata, service worker shell, and reading stats that work locally.",
    excerpt:
      "Shelf installs like an app on desktop and mobile — useful for revisiting cached library structure and reading streak data when connectivity drops.",
    publishedAt: "2026-03-05",
    tags: ["pwa", "offline", "mobile", "install"],
    readingMinutes: 4,
  },
  [
    {
      heading: "Install from the browser",
      paragraphs: [
        "On supported browsers Shelf registers a service worker and manifest for add-to-home-screen. Production builds on Vercel expose the install prompt Chrome expects — study without feeling like a fragile browser tab.",
      ],
    },
    {
      heading: "What works offline",
      paragraphs: [
        "Cached library listings and previously opened PDF bytes (IndexedDB) remain available. Reading streak and timer stats live in localStorage. Full Study AI and uploads require network — the UI surfaces offline status instead of hanging spinners.",
      ],
    },
    {
      heading: "Safe area and standalone mode",
      paragraphs: [
        "Standalone display mode respects iPad notch and home indicator insets so reader panels use the full screen without awkward scroll on the window root.",
      ],
    },
  ]
);
