import type { MetadataRoute } from "next";
import { BLOG_POSTS as STATIC_BLOG_POSTS } from "@/lib/blog/registry";
import { getAllFeatureSlugs, getFeatureBySlug } from "@/lib/seo/featureCatalog";
import {
  INDEXABLE_LEARN_TRACKS,
  learnTrackPath,
} from "@/lib/seo/learnTrackSeo";
import { getSiteUrl } from "@/lib/siteUrl";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:4000";

/** Keep sitemap generation fast so Googlebot does not time out. */
const FETCH_MS = 4_000;

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

async function fetchLearnRoutes(siteUrl: string): Promise<MetadataRoute.Sitemap> {
  try {
    const res = await fetch(`${API_URL}/api/subjects`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(FETCH_MS),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as SubjectList;
    const learnRoutes: MetadataRoute.Sitemap = [];

    for (const subject of data.subjects ?? []) {
      learnRoutes.push({
        url: `${siteUrl}/learn/${subject.slug}`,
        changeFrequency: "weekly",
        priority: 0.8,
      });
      for (const topic of subject.topics ?? []) {
        learnRoutes.push({
          url: `${siteUrl}/learn/${subject.slug}/${topic.slug}`,
          changeFrequency: "weekly",
          priority: 0.7,
        });
        for (const article of topic.articles ?? []) {
          learnRoutes.push({
            url: `${siteUrl}/learn/${subject.slug}/${topic.slug}/${article.slug}`,
            changeFrequency: "weekly",
            priority: 0.85,
          });
        }
      }
    }
    return learnRoutes;
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();

  // Static blog catalog — never block sitemap on a cold backend.
  const blogSlugs = STATIC_BLOG_POSTS.map((p) => p.slug);

  const featureRoutes: MetadataRoute.Sitemap = getAllFeatureSlugs()
    .filter((slug) => {
      const f = getFeatureBySlug(slug);
      return f && !f.canonicalPath;
    })
    .map((slug) => ({
      url: `${siteUrl}/features/${slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/features`, changeFrequency: "weekly", priority: 0.88 },
    { url: `${siteUrl}/blog`, changeFrequency: "weekly", priority: 0.85 },
    { url: `${siteUrl}/learn`, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/subscribe`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/login`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${siteUrl}/quiz`, changeFrequency: "weekly", priority: 0.75 },
    { url: `${siteUrl}/contact`, changeFrequency: "monthly", priority: 0.4 },
    ...blogSlugs.map((slug) => ({
      url: `${siteUrl}/blog/${slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.75,
    })),
    ...featureRoutes,
  ];

  const learnRoutes = await fetchLearnRoutes(siteUrl);
  const trackRoutes: MetadataRoute.Sitemap = INDEXABLE_LEARN_TRACKS.map(
    (goal) => ({
      url: `${siteUrl}${learnTrackPath(goal)}`,
      changeFrequency: "weekly" as const,
      priority: 0.88,
    })
  );
  return [...staticRoutes, ...trackRoutes, ...learnRoutes];
}
