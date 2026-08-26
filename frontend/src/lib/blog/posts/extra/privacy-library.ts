import { longPost } from "../../longPost";

export const privacyLibrary = longPost(
  {
    slug: "privacy-private-study-library",
    title: "Privacy on Shelf: Your PDFs Stay in Your Private Study Library",
    description: "How Shelf keeps personal uploads private: account-scoped storage, JWT auth, separation from public /learn curriculum, and practical habits for shared devices.",
    excerpt: "Your /my-content library is private to your account. Learn how uploads are stored, how Study AI uses your files, and how to stay safe on shared computers.",
    publishedAt: "2026-03-09",
    tags: ["privacy","security","library","trust"],
  },
  [
    {
      heading: "Two spaces: public curriculum and private library",
      paragraphs: [
        "/learn hosts admin-published curriculum anyone can browse. /my-content holds your uploads — not mixed into public search indexes.",
        "Sign-in is required for personal collections, highlights sync, and Study AI on your material.",
      ],
    },
    {
      heading: "Auth basics",
      paragraphs: [
        "Shelf uses JWT Bearer tokens after login. Sign out on shared devices. Use a strong password or Google OAuth you control.",
      ],
    },
    {
      heading: "Where files live",
      paragraphs: [
        "PDFs go to object storage under your user prefix. Pages are served via short-lived signed URLs — the browser fetches ranges directly.",
        "Deleting a page removes it from your library; index cleanup follows processing.",
      ],
    },
    {
      heading: "Study AI and your data",
      paragraphs: [
        "Questions retrieve chunks from your indexed library. Prefer Shelf over pasting confidential PDFs into public chatbots.",
        "Page threads belong to your account.",
      ],
    },
    {
      heading: "Shared computers",
      paragraphs: [
        "Use private browser windows when needed, sign out after sessions, and avoid saving passwords on lab machines.",
      ],
    },
    {
      heading: "What we index for SEO",
      paragraphs: [
        "Marketing pages and /learn curriculum are meant to be crawled. Your private pages are not the public SEO surface.",
      ],
    },
    {
      heading: "Export mindset",
      paragraphs: [
        "Keep critical originals elsewhere if policy requires. Shelf is your working library; backups remain your responsibility for irreplaceable files.",
      ],
    },
    {
      heading: "Report concerns",
      paragraphs: [
        "Contact support from the Contact page if you suspect unauthorized access — rotate password immediately after.",
      ],
    }
  ]
);
