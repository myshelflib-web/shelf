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

/**
 * Leave the auth screen. Soft App Router navigations often stall in Capacitor /
 * Android emulator Next dev (cross-origin /_next). Hard assign is reliable.
 */
export function navigateAfterAuth(
  href: string,
  softNavigate?: (href: string) => void
): void {
  if (typeof window === "undefined") {
    softNavigate?.(href);
    return;
  }
  const host = window.location.hostname;
  const useHardNav =
    host === "10.0.2.2" ||
    (host !== "localhost" && host !== "127.0.0.1") ||
    Boolean(
      (
        window as Window & {
          Capacitor?: { isNativePlatform?: () => boolean };
        }
      ).Capacitor?.isNativePlatform?.()
    );
  if (useHardNav) {
    window.location.assign(href);
    return;
  }
  if (softNavigate) {
    softNavigate(href);
    return;
  }
  window.location.assign(href);
}
