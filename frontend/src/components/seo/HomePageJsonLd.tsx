import { getSiteUrl } from "@/lib/siteUrl";

const FAQ = [
  {
    question: "What is Shelf?",
    answer:
      "Shelf is a personal study library: upload PDFs and notes, bring in YouTube lectures, highlight as you read, ask Study AI grounded in your material, plan revision on a calendar, and sit exam-style quizzes — for college, exams, research, or professional reading.",
  },
  {
    question: "Can I use Shelf without signing in?",
    answer:
      "Yes, in part. Browse free curriculum on Learn, read the public Quiz and Features pages, and explore blog guides without an account. Sign in for your private library at /my-content with highlights, Study AI, planner, and quiz generation from your uploads.",
  },
  {
    question: "Does Shelf have exam-style quizzes?",
    answer:
      "Yes. Shelf Quiz supports timed MCQs, written answers with LaTeX, and photos of working — from your library, uploads with syllabus, or PYQ-style exam banks. Visit /quiz for the public explainer; sign in to generate papers.",
  },
  {
    question: "Can I import PDFs from Telegram?",
    answer:
      "Yes. Connect the Shelf Telegram bot from Settings, then forward PDFs from chats or channels. Files appear in your library with the same reader, highlights, and Study AI as in-app uploads.",
  },
  {
    question: "Can I send PDFs back to Telegram?",
    answer:
      "Yes. Share on a page includes Send to Telegram. The PDF arrives in your Shelf bot chat (up to ~50 MB) so you can forward it into a study group. You can also enable Anyone with link and use Share link in Telegram.",
  },
  {
    question: "Can I watch YouTube lectures in Shelf?",
    answer:
      "Yes. Add page → YouTube and paste a video or playlist URL. Lectures live in your library beside PDFs. Watch in the reader, stamp timestamps into notes, and resume playback like reading progress.",
  },
  {
    question: "Can I listen to Spotify while reading?",
    answer:
      "Yes. Paste a Spotify track, playlist, or podcast URL into the reader focus-audio dock. Playback continues when you hide the panel or enter document fullscreen.",
  },
  {
    question: "Is there a free plan?",
    answer:
      "Yes. Free accounts include private PDF storage, highlights, Study AI with monthly limits, planner, and access to public Learn curriculum. Premium adds more storage, tokens, and Deep Study AI mode.",
  },
] as const;

export function HomePageJsonLd() {
  const siteUrl = getSiteUrl();

  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Shelf product capabilities",
    itemListElement: [
      { name: "Personal PDF library", url: `${siteUrl}/features/personal-library` },
      { name: "YouTube lectures", url: `${siteUrl}/features/youtube-lectures` },
      { name: "PDF reader with highlights", url: `${siteUrl}/features/pdf-highlights` },
      { name: "Study AI", url: `${siteUrl}/features/study-ai` },
      { name: "Exam-style quiz", url: `${siteUrl}/quiz` },
      { name: "Study planner", url: `${siteUrl}/features/planner-calendar` },
      { name: "Telegram import and send", url: `${siteUrl}/features/telegram-pdf-import` },
      { name: "Spotify focus audio", url: `${siteUrl}/features/spotify-focus-audio` },
      { name: "Free Learn curriculum", url: `${siteUrl}/learn` },
      { name: "Document sharing", url: `${siteUrl}/features/document-sharing` },
    ].map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      url: item.url,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }}
      />
    </>
  );
}
