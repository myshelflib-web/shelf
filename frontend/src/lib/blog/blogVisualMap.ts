import type { BlogVisualId } from "@/components/blog/BlogVisuals";

export const POST_HERO_VISUAL: Record<string, BlogVisualId> = {
  "personal-study-library-collections": "library",
  "pdf-reader-highlights-annotations": "reader",
  "study-ai-ask-from-your-pdfs": "study-ai",
  "study-ai-library-wide-chat": "study-ai",
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
};

/** Visual mockup per section index (cycles if fewer entries than sections). */
export const POST_SECTION_VISUALS: Record<string, BlogVisualId[]> = {
  "personal-study-library-collections": ["library", "upload", "dashboard"],
  "pdf-reader-highlights-annotations": ["reader", "study-ai", "upload"],
  "study-ai-ask-from-your-pdfs": ["study-ai", "reader", "library"],
  "study-ai-library-wide-chat": ["study-ai", "library", "dashboard"],
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
