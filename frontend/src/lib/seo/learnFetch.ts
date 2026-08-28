const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:4000";

const FETCH_MS = 4_000;

type LearnSubject = {
  name: string;
  slug: string;
  description?: string | null;
};

type LearnTopic = {
  title: string;
  slug: string;
  description?: string | null;
  subject?: { name: string; slug: string };
};

type LearnArticle = {
  title: string;
  slug: string;
};

export async function fetchLearnSubject(
  slug: string
): Promise<LearnSubject | null> {
  try {
    const res = await fetch(`${API_URL}/api/subjects/${encodeURIComponent(slug)}`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(FETCH_MS),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { subject?: LearnSubject };
    return data.subject ?? null;
  } catch {
    return null;
  }
}

export async function fetchLearnTopic(
  subjectSlug: string,
  topicSlug: string
): Promise<LearnTopic | null> {
  try {
    const res = await fetch(
      `${API_URL}/api/subjects/${encodeURIComponent(subjectSlug)}/topics/${encodeURIComponent(topicSlug)}`,
      { next: { revalidate: 3600 }, signal: AbortSignal.timeout(FETCH_MS) }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { topic?: LearnTopic };
    return data.topic ?? null;
  } catch {
    return null;
  }
}

export async function fetchLearnArticle(
  subjectSlug: string,
  topicSlug: string,
  articleSlug: string
): Promise<LearnArticle | null> {
  try {
    const res = await fetch(
      `${API_URL}/api/subjects/${encodeURIComponent(subjectSlug)}/topics/${encodeURIComponent(topicSlug)}/articles/${encodeURIComponent(articleSlug)}`,
      { next: { revalidate: 3600 }, signal: AbortSignal.timeout(FETCH_MS) }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { article?: LearnArticle };
    return data.article ?? null;
  } catch {
    return null;
  }
}
