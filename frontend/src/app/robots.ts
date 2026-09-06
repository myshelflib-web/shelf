import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/siteUrl";

/** Crawl rules: index marketing & curriculum; keep private app shells out of search. */
export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();
  const host = (() => {
    try {
      return new URL(siteUrl).host;
    } catch {
      return siteUrl.replace(/^https?:\/\//, "");
    }
  })();

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/blog",
          "/blog/",
          "/features",
          "/features/",
          "/learn",
          "/learn/",
          "/about",
          "/contact",
          "/subscribe",
          "/login",
          "/quiz",
          "/legal",
          "/legal/",
        ],
        disallow: [
          "/quiz/",
          "/admin",
          "/admin/",
          "/my-content",
          "/my-content/",
          "/dashboard",
          "/planner",
          "/settings",
          "/profile",
          "/study-ai",
          "/offline",
          "/forgot-password",
          "/onboarding",
          "/api/",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host,
  };
}
