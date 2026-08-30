import { buildPost } from "../types";

export const documentSharing = buildPost(
  {
    slug: "share-study-documents",
    title: "Share Shelf Documents with Classmates — View, Edit & Links",
    description:
      "Share Shelf PDFs and notebooks with classmates: invite by email, Can view or Can edit, Shared with me in the sidebar, optional view links, and save your own copy.",
    excerpt:
      "Share a Shelf page with classmates by email, control view vs edit, open items from Shared with me, and save an independent copy when you need it.",
    publishedAt: "2026-08-26",
    updatedAt: "2026-08-30",
    tags: ["library", "sharing", "collaboration", "pdf", "share shelf"],
    readingMinutes: 5,
  },
  [
    {
      heading: "Share Shelf from the reader or the sidebar",
      paragraphs: [
        "Open any page you own and tap Share in the document chrome, or hover a page in the library explorer and use the share icon. Collections and topics stay private — only individual pages (PDFs, notebooks, docs, and links) can be shared on Shelf.",
        "Add people by name or email. Shelf users get access immediately; others stay as pending invites until they join with that email. Choose Can view or Can edit for each person, then Save.",
      ],
    },
    {
      heading: "Shared with me stays in the left pane",
      paragraphs: [
        "Recipients see a Shared with me section under their own library. Unread shares show a new badge; open the original file without copying it into your tree. If the owner revokes access, the row shows Access removed until you hide it.",
        "From the shared banner you can Save a copy into your library — an independent file that no longer tracks the owner's original. Hide removes the row from Shared with me without deleting copies you already saved.",
      ],
    },
    {
      heading: "Restricted by default, optional view link",
      paragraphs: [
        "General access defaults to Restricted: only people you add can open the file. You can switch to Anyone with link · Can view for a signed-in Shelf link. Link access is view-only; named collaborators can still be editors.",
        "Need the actual PDF in a Telegram group? Share includes Send to Telegram — the file lands in your Shelf bot chat so you can forward it. Anyone with link also has Share link in Telegram for a view-only Shelf URL.",
        "Annotations stay per person. Viewers read the document; editors can highlight and mark up with their own strokes. Delete, rename, and replace remain owner-only.",
      ],
    },
    {
      heading: "Share Shelf for study groups and teachers",
      paragraphs: [
        "Classmates use Share Shelf to pass coaching PDFs without email attachments. Teachers and tutors can share lesson handouts with view access while keeping prep notes private in their own collections.",
        "For a deeper educator workflow — lesson plan PDFs, worksheets, and prep annotations — see the teachers and tutors guide.",
      ],
    },
  ]
);
