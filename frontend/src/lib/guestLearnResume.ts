import { parseLearnPath } from "@/lib/learnCatalog";

const KEY = "shelf:guest-learn-last";

export type GuestLearnResume = {
  subjectSlug: string;
  topicSlug: string;
  articleSlug: string;
  title?: string;
};

export function rememberGuestLearnArticle(
  subjectSlug: string,
  topicSlug: string,
  articleSlug: string,
  title?: string
) {
  if (typeof window === "undefined") return;
  try {
    const payload: GuestLearnResume = {
      subjectSlug,
      topicSlug,
      articleSlug,
      title,
    };
    localStorage.setItem(KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

export function rememberGuestLearnHref(href: string, title?: string) {
  const parsed = parseLearnPath(href);
  if (!parsed.subjectSlug || !parsed.topicSlug || !parsed.articleSlug) return;
  rememberGuestLearnArticle(
    parsed.subjectSlug,
    parsed.topicSlug,
    parsed.articleSlug,
    title
  );
}

export function readGuestLearnResume(): GuestLearnResume | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GuestLearnResume;
    if (
      typeof parsed?.subjectSlug === "string" &&
      typeof parsed?.topicSlug === "string" &&
      typeof parsed?.articleSlug === "string"
    ) {
      return parsed;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function clearGuestLearnResume() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export function guestLearnResumeFromHref(href: string): GuestLearnResume | null {
  const parsed = parseLearnPath(href);
  if (!parsed.subjectSlug || !parsed.topicSlug || !parsed.articleSlug) {
    return null;
  }
  return {
    subjectSlug: parsed.subjectSlug,
    topicSlug: parsed.topicSlug,
    articleSlug: parsed.articleSlug,
  };
}
