import type { BlogPost } from "./types";
import { personalStudyLibrary } from "./posts/personal-study-library";
import { pdfReaderHighlights } from "./posts/pdf-reader-highlights";
import { studyAiPageAsk } from "./posts/study-ai-page-ask";
import { studyAiLibraryChat } from "./posts/study-ai-library-chat";
import { studyAiSummaries } from "./posts/study-ai-summaries";
import { goalAwareStudyAi } from "./posts/goal-aware-study-ai";
import { plannerCalendar } from "./posts/planner-calendar";
import { dashboardStreak } from "./posts/dashboard-streak";
import { readerWorkspace } from "./posts/reader-workspace";
import { sketchAndDoc } from "./posts/sketch-and-doc";
import { freeCurriculum } from "./posts/free-curriculum";
import { shelfPremium } from "./posts/shelf-premium";
import { crossDeviceSync } from "./posts/cross-device-sync";
import { keyboardShortcuts } from "./posts/keyboard-shortcuts";
import { spotifyFocus } from "./posts/spotify-focus";
import { pwaOffline } from "./posts/pwa-offline";
import { studyAiChatControls } from "./posts/study-ai-chat-controls";
import { examStyleQuiz } from "./posts/exam-style-quiz";
import { documentSharing } from "./posts/document-sharing";
import { EXTRA_BLOG_POSTS } from "./posts/extra";

const ALL_POSTS: BlogPost[] = [
  ...EXTRA_BLOG_POSTS,
  documentSharing,
  examStyleQuiz,
  studyAiChatControls,
  pwaOffline,
  spotifyFocus,
  keyboardShortcuts,
  crossDeviceSync,
  shelfPremium,
  freeCurriculum,
  sketchAndDoc,
  readerWorkspace,
  dashboardStreak,
  plannerCalendar,
  goalAwareStudyAi,
  studyAiSummaries,
  studyAiLibraryChat,
  studyAiPageAsk,
  pdfReaderHighlights,
  personalStudyLibrary,
];

export const BLOG_POSTS: BlogPost[] = [...ALL_POSTS].sort((a, b) =>
  b.publishedAt.localeCompare(a.publishedAt)
);

export function getBlogPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

export function getAllBlogSlugs(): string[] {
  return BLOG_POSTS.map((p) => p.slug);
}
