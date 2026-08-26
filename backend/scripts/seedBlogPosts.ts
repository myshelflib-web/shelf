/**
 * Upload blog catalog + illustrations to S3 and upsert Postgres rows.
 *
 * Enriches short feature posts with long-form sections before upload so
 * /api/blog serves complete articles.
 *
 * From repo root (with backend .env: DATABASE_URL + S3 credentials):
 *
 *   npm run blog:seed --prefix backend
 *
 * Or from backend/:
 *
 *   npm run blog:seed
 */
import "dotenv/config";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import prisma from "../src/utils/prisma.js";
import {
  blogHeroKey,
  blogSectionIllustrationKey,
} from "../src/utils/blogPaths.js";
import {
  uploadBlogAsset,
  writeBlogContent,
} from "../src/services/blog/storage.js";
import {
  blogHeroSvg,
  blogSectionSvg,
} from "../src/services/blog/illustrations.js";
import type { BlogPostContent } from "../src/services/blog/types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendBlog = path.resolve(__dirname, "../../frontend/src/lib/blog");
const registryUrl = pathToFileURL(path.join(frontendBlog, "registry.ts")).href;
const enrichUrl = pathToFileURL(path.join(frontendBlog, "enrichBlogPost.ts")).href;

type SeedPost = {
  slug: string;
  title: string;
  description: string;
  excerpt: string;
  publishedAt: string;
  tags: string[];
  readingMinutes: number;
  sections: BlogPostContent["sections"];
};

async function main() {
  const { BLOG_POSTS } = (await import(registryUrl)) as {
    BLOG_POSTS: SeedPost[];
  };
  const { enrichBlogPosts } = (await import(enrichUrl)) as {
    enrichBlogPosts: (posts: SeedPost[]) => SeedPost[];
  };

  const posts = enrichBlogPosts(BLOG_POSTS);
  console.log(
    `Seeding ${posts.length} blog posts (long-form) to S3 + database…`
  );

  if (posts.length < 30) {
    throw new Error(
      `Expected at least 30 posts, got ${posts.length}. Check the frontend registry.`
    );
  }

  for (const post of posts) {
    const heroKey = blogHeroKey(post.slug);
    await uploadBlogAsset(
      heroKey,
      Buffer.from(blogHeroSvg(post.slug), "utf8"),
      "image/svg+xml"
    );

    const sections = await Promise.all(
      post.sections.map(async (section, index) => {
        const illusKey = blogSectionIllustrationKey(post.slug, index);
        await uploadBlogAsset(
          illusKey,
          Buffer.from(blogSectionSvg(index), "utf8"),
          "image/svg+xml"
        );
        return { ...section, illustrationKey: illusKey };
      })
    );

    const contentKey = await writeBlogContent(post.slug, { sections });

    await prisma.blogPost.upsert({
      where: { slug: post.slug },
      create: {
        slug: post.slug,
        title: post.title,
        description: post.description,
        excerpt: post.excerpt,
        tags: post.tags,
        readingMinutes: post.readingMinutes,
        status: "PUBLISHED",
        contentKey,
        heroImageKey: heroKey,
        publishedAt: new Date(post.publishedAt),
      },
      update: {
        title: post.title,
        description: post.description,
        excerpt: post.excerpt,
        tags: post.tags,
        readingMinutes: post.readingMinutes,
        status: "PUBLISHED",
        contentKey,
        heroImageKey: heroKey,
        publishedAt: new Date(post.publishedAt),
      },
    });

    console.log(
      `  ✓ ${post.slug} (${post.sections.length} sections, ~${post.readingMinutes} min)`
    );
  }

  console.log(`Done. ${posts.length} posts published.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
