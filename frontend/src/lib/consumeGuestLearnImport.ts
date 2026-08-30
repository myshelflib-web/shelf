import { api } from "@/lib/api";
import {
  clearGuestLearnResume,
  guestLearnResumeFromHref,
  readGuestLearnResume,
  type GuestLearnResume,
} from "@/lib/guestLearnResume";

let inFlight: Promise<string | null> | null = null;

function pickResume(nextHref?: string | null): GuestLearnResume | null {
  return (
    guestLearnResumeFromHref(nextHref ?? "") ?? readGuestLearnResume()
  );
}

/**
 * After sign-in, copy the last guest-read curriculum article into the
 * personal library and return its reader href (or null).
 */
export function consumeGuestLearnImport(
  nextHref?: string | null
): Promise<string | null> {
  if (inFlight) return inFlight;
  const pending = pickResume(nextHref);
  if (!pending) return Promise.resolve(null);

  inFlight = api.myContent
    .saveCurriculumArticle({
      subjectSlug: pending.subjectSlug,
      topicSlug: pending.topicSlug,
      articleSlug: pending.articleSlug,
    })
    .then((res) => {
      clearGuestLearnResume();
      return res.href;
    })
    .catch(() => null)
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}
