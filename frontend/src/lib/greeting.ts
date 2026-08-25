/** Time-based greeting with the user's first name (trimmed if long). */

import {
  pickGreetingSubtitle,
  pickSalutation,
  timeBucket,
} from "./livelyCopy";

/** First name only — the first whitespace-separated word of the profile name. */
export function getDisplayFirstName(name: string, maxNameLength = 16): string {
  const first = name.trim().split(/\s+/)[0];
  if (!first) return "there";
  return first.length > maxNameLength
    ? `${first.slice(0, maxNameLength - 1)}…`
    : first;
}

export function getGreetingParts(
  name: string,
  maxNameLength = 16
): {
  title: string;
  salutation: string;
  firstName: string;
  subtitle: string;
} {
  const firstName = getDisplayFirstName(name, maxNameLength);
  const hour = new Date().getHours();
  const salutation = pickSalutation({ hour });
  const subtitle = pickGreetingSubtitle({ hour });

  return {
    salutation,
    firstName,
    title: `${salutation}, ${firstName}`,
    subtitle,
  };
}

/** Time-based greeting with the user's first name (trimmed if long). */
export function getGreeting(name: string, maxNameLength = 16): string {
  return getGreetingParts(name, maxNameLength).title;
}

export { timeBucket };
