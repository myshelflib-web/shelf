import type { BlogVisualId } from "@/components/blog/BlogVisuals";

export const POST_HERO_VISUAL: Record<string, BlogVisualId> = {
  "personal-study-library-collections": "library",
  "pdf-reader-highlights-annotations": "reader",
  "study-ai-ask-from-your-pdfs": "study-ai",
  "study-ai-library-wide-chat": "study-ai",
  "study-ai-stop-queue-diagrams": "study-ai",
  "study-ai-summaries-mind-maps": "study-ai",
  "goal-aware-study-ai": "study-ai",
  "planner-tasks-events-calendar": "calendar",
  "study-dashboard-streak-achievements": "dashboard",
  "reader-workspace-tabs-split-view": "split-view",
  "sketch-notebook-and-doc-pages": "notebook",
  "free-exam-curriculum-learn": "curriculum",
  "shelf-premium-subscription": "premium",
  "cross-device-reading-progress": "sync",
  "keyboard-shortcuts-command-search": "keyboard",
  "spotify-focus-audio-while-reading": "spotify",
  "pwa-offline-study-app": "pwa",
  "getting-started-with-shelf": "upload",
  "how-to-upload-organize-pdfs": "upload",
  "college-students-lecture-notes": "library",
  "law-students-case-law-library": "reader",
  "medical-and-science-pdf-workflow": "reader",
  "research-papers-literature-notes": "study-ai",
  "professionals-work-documents": "dashboard",
  "teachers-lesson-materials": "calendar",
  "privacy-private-study-library": "library",
  "shelf-vs-generic-chatbots": "study-ai",
  "dark-mode-focused-reading": "reader",
  "pin-collections-continue-reading": "dashboard",
  "language-learning-with-pdfs": "notebook",
  "nonfiction-book-notes": "library",
  "search-your-entire-library": "keyboard",
};

/** Visual mockup per section index (cycles if fewer entries than sections). */
export const POST_SECTION_VISUALS: Record<string, BlogVisualId[]> = {
  "personal-study-library-collections": ["library", "upload", "dashboard"],
  "pdf-reader-highlights-annotations": ["reader", "study-ai", "upload"],
  "study-ai-ask-from-your-pdfs": ["study-ai", "reader", "library"],
  "study-ai-library-wide-chat": ["study-ai", "library", "dashboard"],
  "study-ai-stop-queue-diagrams": ["study-ai", "library", "calendar"],
  "study-ai-summaries-mind-maps": ["study-ai", "reader"],
  "goal-aware-study-ai": ["study-ai", "dashboard"],
  "planner-tasks-events-calendar": ["calendar", "dashboard", "reader"],
  "study-dashboard-streak-achievements": ["dashboard", "calendar", "library"],
  "reader-workspace-tabs-split-view": ["split-view", "reader", "study-ai"],
  "sketch-notebook-and-doc-pages": ["notebook", "upload", "library"],
  "free-exam-curriculum-learn": ["curriculum", "library", "study-ai"],
  "shelf-premium-subscription": ["premium", "study-ai", "library"],
  "cross-device-reading-progress": ["sync", "reader", "library"],
  "keyboard-shortcuts-command-search": ["keyboard", "library", "study-ai"],
  "spotify-focus-audio-while-reading": ["spotify", "reader"],
  "pwa-offline-study-app": ["pwa", "library", "sync"],
  "getting-started-with-shelf": ["upload", "library", "study-ai", "calendar"],
  "how-to-upload-organize-pdfs": ["upload", "library", "dashboard"],
  "college-students-lecture-notes": ["library", "reader", "calendar"],
  "law-students-case-law-library": ["reader", "split-view", "study-ai"],
  "medical-and-science-pdf-workflow": ["reader", "notebook", "study-ai"],
  "research-papers-literature-notes": ["study-ai", "split-view", "library"],
  "professionals-work-documents": ["dashboard", "reader", "calendar"],
  "teachers-lesson-materials": ["calendar", "library", "notebook"],
  "privacy-private-study-library": ["library", "sync", "dashboard"],
  "shelf-vs-generic-chatbots": ["study-ai", "reader", "library"],
  "dark-mode-focused-reading": ["reader", "spotify", "pwa"],
  "pin-collections-continue-reading": ["dashboard", "library", "sync"],
  "language-learning-with-pdfs": ["notebook", "reader", "calendar"],
  "nonfiction-book-notes": ["library", "reader", "study-ai"],
  "search-your-entire-library": ["keyboard", "library", "study-ai"],
};

export function heroVisualForSlug(slug: string): BlogVisualId | undefined {
  return POST_HERO_VISUAL[slug];
}

export function sectionVisualForSlug(
  slug: string,
  sectionIndex: number
): BlogVisualId | undefined {
  const list = POST_SECTION_VISUALS[slug];
  if (!list?.length) return undefined;
  return list[sectionIndex % list.length];
}
