import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { MarketingFooter } from "@/components/MarketingFooter";
import { BlogJsonLd } from "@/components/blog/BlogJsonLd";
import { BlogPostBody } from "@/components/blog/BlogPostBody";
import {
  fetchAllBlogSlugs,
  fetchPublishedBlogPost,
} from "@/lib/blog/fetchBlog";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { ArrowLeft, Clock } from "lucide-react";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const slugs = await fetchAllBlogSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchPublishedBlogPost(slug);
  if (!post) return { title: "Article not found" };

  const meta = buildPageMetadata({
    title: post.title,
    description: post.description,
    path: `/blog/${post.slug}`,
    keywords: post.tags,
  });

  return {
    ...meta,
    openGraph: {
      ...meta.openGraph,
      type: "article",
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt ?? post.publishedAt,
      tags: post.tags,
      ...(post.coverImageUrl ? { images: [post.coverImageUrl] } : {}),
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await fetchPublishedBlogPost(slug);
  if (!post) notFound();

  return (
    <div className="h-full overflow-y-auto flex flex-col">
      <BlogJsonLd post={post} />
      <Header />
      <main className="flex-1">
        <article className="px-4 sm:px-6 py-12 sm:py-16">
          <div className="max-w-3xl mx-auto">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] mb-8 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            All articles
          </Link>

          <header className="mb-10 pb-8 border-b border-[var(--border)]">
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] uppercase tracking-wide font-medium px-2 py-0.5 rounded-md bg-[var(--accent-subtle)] text-[var(--accent)]"
                >
                  {tag}
                </span>
              ))}
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight mb-4">
              {post.title}
            </h1>
            <p className="text-lg text-[var(--text-secondary)] leading-relaxed mb-4">
              {post.excerpt}
            </p>
            {post.coverImageUrl && (
              <figure className="mb-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={post.coverImageUrl}
                  alt=""
                  className="w-full rounded-xl border border-[var(--border)] object-cover max-h-80"
                />
              </figure>
            )}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--text-muted)]">
              <time dateTime={post.publishedAt}>
                Published{" "}
                {new Date(post.publishedAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </time>
              <span className="inline-flex items-center gap-1">
                <Clock className="w-4 h-4" aria-hidden />
                {post.readingMinutes} min read
              </span>
            </div>
          </header>
          </div>

          <div className="max-w-6xl mx-auto">
            <BlogPostBody post={post} />
          </div>

          <div className="max-w-3xl mx-auto">
          <footer className="mt-12 pt-8 border-t border-[var(--border)]">
            <p className="text-[var(--text-secondary)] mb-4">
              Start using these features in your own library — free to sign up.
            </p>
            <Link href="/login" className="btn-primary inline-flex">
              Get started on Shelf
            </Link>
          </footer>
          </div>
        </article>
      </main>
      <MarketingFooter />
    </div>
  );
}
