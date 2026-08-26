import { buildPost } from "../types";

export const documentSharing = buildPost(
  {
    slug: "share-study-documents",
    title: "Share Study Documents with Classmates on Shelf",
    description:
      "Invite Shelf users to view or annotate a PDF or notebook, keep Shared with me in the library sidebar, and save your own copy when you need it.",
    excerpt:
      "Share a page with classmates by email, control view vs edit, open items from Shared with me, and save an independent copy to your library.",
    publishedAt: "2026-08-26",
    tags: ["library", "sharing", "collaboration", "pdf"],
    readingMinutes: 5,
  },
  [
    {
      heading: "Share from the reader or the sidebar",
      paragraphs: [
        "Open any page you own and tap Share in the document chrome, or hover a page in the library explorer and use the share icon. Collections and topics stay private — only individual pages (PDFs, notebooks, docs, and links) can be shared.",
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
        "Annotations stay per person. Viewers read the document; editors can highlight and mark up with their own strokes. Delete, rename, and replace remain owner-only.",
      ],
    },
  ]
);
