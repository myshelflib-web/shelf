/** Cursor-style labels for Study AI stream status (live vs completed). */

type StatusCopy = { live: string; done: string };

const STATUS_COPY: Record<string, StatusCopy> = {
  "Starting Study AI…": { live: "Getting ready", done: "Ready" },
  "Getting ready": { live: "Getting ready", done: "Ready" },
  "Reading this file…": { live: "Reading document", done: "Read document" },
  "Reading document": { live: "Reading document", done: "Read document" },
  "Searching your notes…": {
    live: "Exploring your library",
    done: "Explored your library",
  },
  "Exploring your library": {
    live: "Exploring your library",
    done: "Explored your library",
  },
  "Searching your collections…": {
    live: "Exploring library",
    done: "Explored library",
  },
  "Exploring library": { live: "Exploring library", done: "Explored library" },
  "Writing answer…": { live: "Composing answer", done: "Composed answer" },
  "Composing answer": { live: "Composing answer", done: "Composed answer" },
  "Finishing answer…": { live: "Polishing answer", done: "Polished answer" },
  "Polishing answer": { live: "Polishing answer", done: "Polished answer" },
  "Switched to single-pass answer…": {
    live: "Retrying answer",
    done: "Retried answer",
  },
  "Synthesizing full analysis…": {
    live: "Synthesizing sections",
    done: "Synthesized sections",
  },
  "Searching your library…": {
    live: "Exploring library",
    done: "Explored library",
  },
  "Opening a page…": { live: "Opening page", done: "Opened page" },
  "Browsing collections…": {
    live: "Browsing collections",
    done: "Browsed collections",
  },
  "Checking your planner…": {
    live: "Checking planner",
    done: "Checked planner",
  },
  "Searching Google…": { live: "Searching the web", done: "Searched the web" },
  "Reading your highlights…": {
    live: "Reading highlights",
    done: "Read highlights",
  },
  "Checking recent pages…": {
    live: "Checking recents",
    done: "Checked recents",
  },
  "Opening starred pages…": {
    live: "Opening starred pages",
    done: "Opened starred pages",
  },
  "Opening a collection…": {
    live: "Opening collection",
    done: "Opened collection",
  },
  "Reading your syllabus…": {
    live: "Reading syllabus",
    done: "Read syllabus",
  },
  "Fetching a web page…": {
    live: "Fetching web page",
    done: "Fetched web page",
  },
  "Checking the date…": { live: "Checking date", done: "Checked date" },
  "Using a tool…": { live: "Using a tool", done: "Used a tool" },
  "Thought briefly": { live: "Thought briefly", done: "Thought briefly" },
  "Thinking": { live: "Thinking", done: "Thought" },
  "Planning next step": {
    live: "Planning next step",
    done: "Planned next step",
  },
  "Still working": { live: "Still working", done: "Worked through it" },
};

export const STREAM_PULSE_PHRASES = [
  "Thought briefly",
  "Thinking",
  "Planning next step",
  "Still working",
] as const;

function normalizeKey(raw: string): string {
  return raw.replace(/…+$/, "").trim();
}

/** Map backend / client status text to Cursor-style copy. */
export function formatStreamStatusDetail(raw: string, done: boolean): string {
  const trimmed = raw.trim();
  if (!trimmed) return done ? "Done" : "Working";
  const mapped =
    STATUS_COPY[trimmed] ??
    STATUS_COPY[`${normalizeKey(trimmed)}…`] ??
    STATUS_COPY[normalizeKey(trimmed)];
  if (mapped) return done ? mapped.done : mapped.live;
  return normalizeKey(trimmed) || "Working";
}

/** Section heading for map-reduce progress, e.g. "Reading section 2 of 5…". */
export function formatSectionProgressDetail(raw: string, done: boolean): string {
  const match = raw.match(/Reading section (\d+) of (\d+)/i);
  if (!match) return formatStreamStatusDetail(raw, done);
  const [, i, n] = match;
  return done
    ? `Read section ${i} of ${n}`
    : `Reading section ${i} of ${n}`;
}

export function displayStreamStatusDetail(raw: string, done: boolean): string {
  if (/reading section \d+ of \d+/i.test(raw)) {
    return formatSectionProgressDetail(raw, done);
  }
  const foundMatch = raw.match(/Found (\d+) page/i);
  if (foundMatch) {
    const count = Number(foundMatch[1]);
    const noun = count === 1 ? "page" : "pages";
    return done
      ? `Found ${count} ${noun}`
      : `Found ${count} ${noun}`;
  }
  if (/no matching pages/i.test(raw)) {
    return done ? "No matching pages" : "Searching library";
  }
  if (/^Done · /i.test(raw)) {
    return raw.replace(/^Done · /i, "Answered with ");
  }
  return formatStreamStatusDetail(raw, done);
}
