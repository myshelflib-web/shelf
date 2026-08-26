import type { BlogPost, BlogSection } from "./types";
import { buildPost } from "./types";

/** ~180 wpm; long guides target 12–18 min. */
export function estimateReadingMinutes(sections: BlogSection[], excerpt = ""): number {
  let words = excerpt.trim().split(/\s+/).filter(Boolean).length;
  for (const s of sections) {
    if (s.heading) words += s.heading.trim().split(/\s+/).filter(Boolean).length;
    for (const p of s.paragraphs) words += p.trim().split(/\s+/).filter(Boolean).length;
    for (const b of s.bullets ?? []) words += b.trim().split(/\s+/).filter(Boolean).length;
  }
  return Math.max(12, Math.min(20, Math.ceil(words / 180)));
}

export function longPost(
  meta: Omit<BlogPost, "sections" | "readingMinutes"> & { readingMinutes?: number },
  sections: BlogSection[]
): BlogPost {
  return buildPost(
    {
      ...meta,
      readingMinutes: meta.readingMinutes ?? estimateReadingMinutes(sections, meta.excerpt),
    },
    sections
  );
}
