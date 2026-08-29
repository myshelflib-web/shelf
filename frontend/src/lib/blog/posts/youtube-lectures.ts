import { buildPost } from "../types";

export const youtubeLectures = buildPost(
  {
    slug: "youtube-lectures-in-your-library",
    title: "Watch YouTube Lectures in Your Shelf Library While You Take Notes",
    description:
      "Paste a YouTube video or playlist into Shelf. Lectures live beside PDFs in your library — watch, stamp timestamps, and take notes in the same reader.",
    excerpt:
      "Bring coaching playlists into the same collections as your PDFs. Watch in the reader, stamp the time into notes, and resume on any device.",
    publishedAt: "2026-08-29",
    tags: ["youtube", "library", "notes", "lectures", "reader"],
    readingMinutes: 5,
  },
  [
    {
      heading: "Lectures belong in the same library as PDFs",
      paragraphs: [
        "Most students already study from YouTube — coaching playlists, recorded classes, explainers — while notes live in another tab. Shelf treats a lecture as a page, not a side player. Add page → YouTube, paste a watch link or a playlist URL, and the video sits in your collection next to the matching PDF.",
        "A single video becomes one page. A playlist becomes a topic inside the collection you are in — or a new collection if you add it from the library root — with one page per lecture, titles from YouTube, order preserved.",
      ],
    },
    {
      heading: "Watch and take notes without leaving the reader",
      paragraphs: [
        "Open a YouTube page and the official player fills the document pane. Notes sit directly underneath in a typed doc. Stamp inserts the current time as a clickable 12:34 link so you can jump back during revision. Playback speed, resume from the last second, and watch time all follow the same reader habits as PDF progress.",
        "Need the textbook beside the teacher? Split view already works: drop the PDF onto the other pane. Study AI on the page can use your notes plus the lecture title and link.",
      ],
    },
    {
      heading: "What Shelf does not host",
      paragraphs: [
        "Videos stay on YouTube. Shelf stores the link and your notes — not a downloaded file — so you stay within YouTube's terms and your storage quota. Some videos block embedding; Open on YouTube still works, and your notes remain in Shelf. Public playlist feeds include about the first 15 lectures unless a YouTube Data API key is configured on the server for a full import.",
      ],
    },
  ]
);
