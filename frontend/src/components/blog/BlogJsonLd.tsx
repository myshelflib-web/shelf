import type { BlogPost } from "@/lib/blog";
import { getSiteUrl } from "@/lib/siteUrl";

export function BlogJsonLd({ post }: { post: BlogPost }) {
  const siteUrl = getSiteUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt ?? post.publishedAt,
    author: {
      "@type": "Organization",
      name: "Shelf",
    },
    publisher: {
      "@type": "Organization",
      name: "Shelf",
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/icons/shelf-icon-2048.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${siteUrl}/blog/${post.slug}`,
    },
    keywords: post.tags.join(", "),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export function BlogListingJsonLd({ posts }: { posts: BlogPost[] }) {
  const siteUrl = getSiteUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Shelf Blog",
    description:
      "Guides for personal study libraries: PDF highlights, Study AI, planner, sharing, and exam workflows.",
    url: `${siteUrl}/blog`,
    blogPost: posts.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      url: `${siteUrl}/blog/${post.slug}`,
      datePublished: post.publishedAt,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
