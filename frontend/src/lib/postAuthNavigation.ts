import { consumeGuestLearnImport } from "@/lib/consumeGuestLearnImport";
import { seedLibraryModeForNewUser } from "@/lib/libraryMode";
import { goalHasPreloadedLibrary } from "@/lib/studyGoal";
import { StudyGoal } from "@/types";

/** After sign-in, copy the last guest-read curriculum article if any. */
export async function destinationAfterSignIn(
  nextPath: string
): Promise<string> {
  return (await consumeGuestLearnImport(nextPath)) ?? nextPath;
}

/**
 * After onboarding: seed Preloaded for a non-generic goal, import the last
 * guest PDF, and land on the signed-in library when the next URL is /learn.
 */
export async function destinationAfterOnboarding(
  nextPath: string,
  goal: StudyGoal
): Promise<string> {
  seedLibraryModeForNewUser(goal);
  const imported = await consumeGuestLearnImport(nextPath);
  if (imported) return imported;
  if (
    goalHasPreloadedLibrary(goal) &&
    (nextPath === "/my-content" || nextPath.startsWith("/learn"))
  ) {
    return "/my-content";
  }
  return nextPath;
}
