import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { MarketingFooter } from "@/components/MarketingFooter";
import { RevealOnScroll } from "@/components/RevealOnScroll";
import { BlogCard } from "@/components/blog/BlogCard";
import { BlogListingJsonLd } from "@/components/blog/BlogJsonLd";
import { fetchPublishedBlogPosts } from "@/lib/blog/fetchBlog";
import { BLOG_INDEX_DESCRIPTION } from "@/lib/seo/keywords";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = buildPageMetadata({
  title: "Blog — Study library guides for every kind of reader",
  description: BLOG_INDEX_DESCRIPTION,
  path: "/blog",
});

export default async function BlogIndexPage() {
  const posts = await fetchPublishedBlogPosts();

  return (
    <div className="h-full overflow-y-auto flex flex-col">
      <BlogListingJsonLd posts={posts} />
      <Header />
      <main className="flex-1">
        <section className="relative px-4 sm:px-6 py-16 sm:py-20 max-w-6xl mx-auto overflow-hidden">
          <div className="hero-glow" aria-hidden />
          <RevealOnScroll>
            <p className="text-sm font-medium text-[var(--accent)] mb-3 tracking-wide uppercase">
              Shelf Blog
            </p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 tracking-tight leading-tight max-w-3xl">
              Long guides to everything Shelf can do
            </h1>
            <p className="text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed max-w-2xl">
              Feature deep-dives and workflows for students, professionals,
              researchers, and lifelong learners — PDF libraries, highlights,
              Study AI, planner, and more.
            </p>
          </RevealOnScroll>
        </section>

        <section className="px-4 sm:px-6 pb-20 max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {posts.map((post, index) => (
              <RevealOnScroll key={post.slug} delay={index * 40}>
                <BlogCard post={post} />
              </RevealOnScroll>
            ))}
          </div>
        </section>

        <section className="px-4 sm:px-6 pb-20 max-w-3xl mx-auto text-center">
          <RevealOnScroll>
            <h2 className="text-2xl font-semibold mb-3">Ready to try Shelf?</h2>
            <p className="text-[var(--text-secondary)] mb-6">
              Browse free curriculum or sign in to build your own library.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link href="/login" className="btn-primary">
                Create your library
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/learn" className="btn-secondary">
                Browse free library
              </Link>
            </div>
          </RevealOnScroll>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
