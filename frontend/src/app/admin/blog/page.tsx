"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { api } from "@/lib/api";
import type { AdminBlogPostRow } from "@/types";
import { ArrowRight, Plus, Pencil } from "lucide-react";

const statusStyles: Record<string, string> = {
  PUBLISHED: "bg-green-500/10 text-green-500",
  DRAFT: "bg-gray-500/10 text-gray-400",
};

export default function AdminBlogListPage() {
  const [posts, setPosts] = useState<AdminBlogPostRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.admin
      .listBlogPosts()
      .then(({ posts: next }) => setPosts(next))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">Blog posts</h1>
          <p className="text-[var(--text-secondary)] mt-1">
            Feature articles stored in S3 with auto-generated illustrations
          </p>
        </div>
        <Link href="/admin/blog/new" className="btn-primary">
          <Plus className="w-4 h-4" />
          New article
        </Link>
      </div>

      {loading ? (
        <p className="text-[var(--text-muted)]">Loading…</p>
      ) : posts.length === 0 ? (
        <div className="p-8 rounded-xl border border-dashed border-[var(--border)] text-center text-[var(--text-muted)]">
          No blog posts yet.{" "}
          <Link href="/admin/blog/new" className="text-[var(--accent)] hover:underline">
            Create one
          </Link>{" "}
          or run <code className="text-xs">npm run blog:seed --prefix backend</code> to
          import the catalog.
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--border)] divide-y divide-[var(--border)]">
          {posts.map((post) => (
            <div
              key={post.id}
              className="flex items-center gap-4 px-4 py-3 hover:bg-[var(--bg-secondary)]/50"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{post.title}</p>
                <p className="text-xs text-[var(--text-muted)] font-mono truncate">
                  /blog/{post.slug}
                </p>
              </div>
              <span
                className={clsx(
                  "text-xs px-2 py-0.5 rounded-full font-medium shrink-0",
                  statusStyles[post.status] ?? statusStyles.DRAFT
                )}
              >
                {post.status}
              </span>
              <Link
                href={`/admin/blog/${post.id}/edit`}
                className="inline-flex items-center gap-1 text-sm text-[var(--accent)] hover:underline shrink-0"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit
              </Link>
              {post.status === "PUBLISHED" && (
                <Link
                  href={`/blog/${post.slug}`}
                  target="_blank"
                  className="text-[var(--text-muted)] hover:text-[var(--accent)] shrink-0"
                  aria-label="View live"
                >
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
