import { longPost } from "../../longPost";

export const gettingStarted = longPost(
  {
    slug: "getting-started-with-shelf",
    title: "Getting Started with Shelf: Your First Week in a Personal Study Library",
    description: "Sign up, upload your first PDFs, organize collections, try highlights and Study AI, and set a study planner rhythm — a practical onboarding guide for Shelf.",
    excerpt: "New to Shelf? This walkthrough covers account setup, your first uploads, library structure, reading with highlights, asking Study AI, and planning tasks without overwhelm.",
    publishedAt: "2026-03-01",
    tags: ["getting started","onboarding","study library","how to"],
  },
  [
    {
      heading: "Create your account and land in the library",
      paragraphs: [
        "Shelf is a personal study workspace: after you sign in, /my-content becomes home. You are not dropped into a content marketplace — you start with empty shelves you fill yourself.",
        "Use email OTP or Google sign-in. Once authenticated, the header search (⌘K), theme toggle, and navigation to Library, Planner, Dashboard, and Study AI are available immediately.",
      ],
    },
    {
      heading: "Upload something you already study",
      paragraphs: [
        "Pick one PDF you open every week — a textbook chapter, lecture deck, case brief, or work brief. Use Add material from the library, drop the file, and wait for the short-lived upload to finish.",
        "Shelf stores one source PDF per page. Processing builds searchable text in the background so highlights and Study AI work when HTML is ready; you can open the original PDF view right away.",
      ],
    },
    {
      heading: "Collections, topics, and root pages",
      paragraphs: [
        "Create a collection named after a course, project, or exam paper. Add topics only when a folder would hold more than a handful of pages. Root-level pages sit beside collections for quick one-offs.",
        "Shelf never invents a default General topic. Empty structure stays out of the way until you need hierarchy.",
      ],
    },
    {
      heading: "Read with highlights",
      paragraphs: [
        "Open your page in the reader. Select text and apply a highlight color. Consistent colors (definitions, questions, action items) make revision faster later.",
        "Toggle sidebar with ⌘B, flip pages with arrows, and reopen later — IndexedDB caches bytes so return visits feel instant.",
      ],
    },
    {
      heading: "Ask Study AI on day one",
      paragraphs: [
        "Select a confusing paragraph and press ⌘L (or open the Study AI panel). Ask for a short explanation or bullet summary grounded in that passage.",
        "Answers cite your material when retrieval finds matches. Page-scoped threads save so you can continue tomorrow.",
      ],
    },
    {
      heading: "Plan one concrete task",
      paragraphs: [
        "Open Planner and add a task linked to the page you uploaded: Finish chapter 3 notes. Schedule it on a day you can keep.",
        "Completing tasks updates the dashboard without blanking the UI — mutations stay optimistic and non-blocking.",
      ],
    },
    {
      heading: "Optional: browse free curriculum",
      paragraphs: [
        "If you want baseline syllabus content, open /learn. It is separate from your private library — use it as reference while keeping personal notes in /my-content.",
        "Curriculum is optional. Many users never open Learn and still get full value from uploads, highlights, AI, and planner.",
      ],
    },
    {
      heading: "Habits that stick after week one",
      paragraphs: [
        "Upload before you take notes elsewhere. Highlight while reading, not after. Ask Study AI when stuck instead of switching to a generic chatbot that has never seen your file.",
        "Pin one active collection, install Shelf as a PWA if you study on mobile, and use ⌘K instead of hunting folders. Small habits compound into a library you trust.",
      ],
    }
  ]
);
