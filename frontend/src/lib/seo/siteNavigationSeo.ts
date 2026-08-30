import { getSiteUrl } from "@/lib/siteUrl";

/**
 * Primary nav targets Google may use for organic sitelinks.
 * SEO-only — mirrors footer/header destinations, not visible UI.
 */
export const SITE_NAV_LINKS = [
  {
    name: "Sign in",
    description: "Sign in to Shelf and open your personal study library.",
    path: "/login",
  },
  {
    name: "Features",
    description: "Explore Shelf features — PDF library, Study AI, quiz, and more.",
    path: "/features",
  },
  {
    name: "Free curriculum",
    description: "Browse free study curriculum on Shelf Learn without an account.",
    path: "/learn",
  },
  {
    name: "Pricing",
    description: "Shelf plans and Premium pricing.",
    path: "/subscribe",
  },
  {
    name: "Blog",
    description: "Guides for using Shelf as your study library.",
    path: "/blog",
  },
  {
    name: "About",
    description: "About Shelf — personal study workspace for serious reading.",
    path: "/about",
  },
  {
    name: "Exam-style quiz",
    description: "Practice MCQs and written answers from your Shelf library.",
    path: "/quiz",
  },
] as const;

export function siteNavigationJsonLd() {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@graph": SITE_NAV_LINKS.map((link) => ({
      "@type": "SiteNavigationElement",
      name: link.name,
      description: link.description,
      url: `${siteUrl}${link.path}`,
    })),
  };
}
