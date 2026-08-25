"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { API_URL } from "@/lib/api";
import type { BlogPost } from "@/lib/blog/types";
import { BLOG_POSTS as STATIC_POSTS } from "@/lib/blog/registry";
import { BlogCard } from "@/components/blog/BlogCard";
import { RevealOnScroll } from "@/components/RevealOnScroll";

export function BlogPreviewSection({ limit = 3 }: { limit?: number }) {
  const [posts, setPosts] = useState<BlogPost[]>(STATIC_POSTS.slice(0, limit));

  useEffect(() => {
    void fetch(`${API_URL}/api/blog`, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { posts?: BlogPost[] } | null) => {
        if (data?.posts?.length) setPosts(data.posts.slice(0, limit));
      })
      .catch(() => {});
  }, [limit]);

  return (
    <section className="px-4 sm:px-6 py-16 sm:py-20 border-t border-[var(--border)]">
      <div className="max-w-6xl mx-auto">
        <RevealOnScroll>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
            <div>
              <p className="text-sm font-medium text-[var(--accent)] mb-2 tracking-wide uppercase">
                Shelf Blog
              </p>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
                Learn how every feature works
              </h2>
              <p className="text-[var(--text-secondary)] mt-2 max-w-xl leading-relaxed">
                In-depth guides on libraries, PDF reading, Study AI, planning, and
                more — written for students building a serious revision workflow.
              </p>
            </div>
            <Link href="/blog" className="btn-secondary shrink-0 self-start sm:self-auto">
              View all articles
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </RevealOnScroll>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.map((post, index) => (
            <RevealOnScroll key={post.slug} delay={index * 60}>
              <BlogCard post={post} />
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}
