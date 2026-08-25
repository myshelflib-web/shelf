import Link from "next/link";
import type { BlogPost } from "@/lib/blog";
import { ArrowRight, Clock } from "lucide-react";

export function BlogCard({ post }: { post: BlogPost }) {
  return (
    <article className="feature-card h-full rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] flex flex-col overflow-hidden">
      {post.coverImageUrl && (
        <div className="aspect-[16/9] bg-[var(--bg-primary)] border-b border-[var(--border)] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.coverImageUrl}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}
      <div className="p-5 flex flex-col flex-1">
      <div className="flex flex-wrap gap-2 mb-3">
        {post.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="text-[10px] uppercase tracking-wide font-medium px-2 py-0.5 rounded-md bg-[var(--accent-subtle)] text-[var(--accent)]"
          >
            {tag}
          </span>
        ))}
      </div>
      <h2 className="font-semibold text-lg mb-2 leading-snug">
        <Link href={`/blog/${post.slug}`} className="hover:text-[var(--accent)] transition">
          {post.title}
        </Link>
      </h2>
      <p className="text-sm text-[var(--text-secondary)] leading-relaxed flex-1 mb-4">
        {post.excerpt}
      </p>
      <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mt-auto pt-3 border-t border-[var(--border-subtle)]">
        <time dateTime={post.publishedAt}>
          {new Date(post.publishedAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </time>
        <span className="inline-flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" aria-hidden />
          {post.readingMinutes} min read
        </span>
      </div>
      <Link
        href={`/blog/${post.slug}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] mt-3 hover:underline"
      >
        Read article
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
      </div>
    </article>
  );
}
