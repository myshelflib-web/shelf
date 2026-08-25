import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/siteUrl";

/** Crawl rules: index marketing & curriculum; keep private app shells out of search. */
export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/blog",
          "/blog/",
          "/learn",
          "/learn/",
          "/about",
          "/contact",
          "/subscribe",
        ],
        disallow: [
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
          "/login",
          "/forgot-password",
          "/api/",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
