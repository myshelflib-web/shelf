/**
 * Upload static blog catalog + illustrations to S3 and upsert Postgres rows.
 * Run from repo root: npm run blog:seed --prefix backend
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
const registryUrl = pathToFileURL(
  path.resolve(__dirname, "../../frontend/src/lib/blog/registry.ts")
).href;

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

  console.log(`Seeding ${BLOG_POSTS.length} blog posts to S3 + database…`);

  for (const post of BLOG_POSTS) {
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

    console.log(`  ✓ ${post.slug}`);
  }

  console.log("Done.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
