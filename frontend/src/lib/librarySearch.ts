import { UserSubject, UserPageSummary } from "@/types";
import { flattenPages, pageHref } from "@/lib/myContentTree";

export interface LibrarySearchHit {
  id: string;
  title: string;
  href: string;
  notebook: string;
  topic: string;
  snippet: string;
}

export function searchLibrary(
  sections: UserSubject[],
  query: string,
  rootPages: UserPageSummary[] = []
): LibrarySearchHit[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const hits: LibrarySearchHit[] = [];

  for (const page of rootPages) {
    if (!page.title.toLowerCase().includes(q)) continue;
    hits.push({
      id: page.id,
      title: page.title,
      href: pageHref(null, null, page.slug),
      notebook: "Library",
      topic: "",
      snippet: "Library",
    });
  }

  for (const section of sections) {
    for (const { page, href, topicTitle } of flattenPages(section)) {
      const haystack = [page.title, topicTitle ?? "", section.name]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) continue;
      const topic = topicTitle ?? "";
      hits.push({
        id: page.id,
        title: page.title,
        href,
        notebook: section.name,
        topic,
        snippet: topic ? `${section.name} · ${topic}` : section.name,
      });
    }
  }
  return hits.slice(0, 12);
}
