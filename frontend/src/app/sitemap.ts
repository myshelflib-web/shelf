import type { MetadataRoute } from "next";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:4000";
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "http://localhost:3000";

type SubjectList = {
  subjects: Array<{
    slug: string;
    updatedAt?: string;
    topics: Array<{
      slug: string;
      articles?: Array<{ slug: string }>;
    }>;
  }>;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/learn`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/contact`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/subscribe`, changeFrequency: "monthly", priority: 0.4 },
  ];

  try {
    const res = await fetch(`${API_URL}/api/subjects`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return staticRoutes;
    const data = (await res.json()) as SubjectList;
    const learnRoutes: MetadataRoute.Sitemap = [];

    for (const subject of data.subjects ?? []) {
      learnRoutes.push({
        url: `${SITE_URL}/learn/${subject.slug}`,
        changeFrequency: "weekly",
        priority: 0.8,
      });
      for (const topic of subject.topics ?? []) {
        learnRoutes.push({
          url: `${SITE_URL}/learn/${subject.slug}/${topic.slug}`,
          changeFrequency: "weekly",
          priority: 0.7,
        });
        for (const article of topic.articles ?? []) {
          learnRoutes.push({
            url: `${SITE_URL}/learn/${subject.slug}/${topic.slug}/${article.slug}`,
            changeFrequency: "weekly",
            priority: 0.85,
          });
        }
      }
    }

    return [...staticRoutes, ...learnRoutes];
  } catch {
    return staticRoutes;
  }
}
