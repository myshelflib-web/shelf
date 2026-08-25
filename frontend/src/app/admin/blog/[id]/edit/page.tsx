"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { BlogEditor } from "@/components/admin/BlogEditor";
import { api } from "@/lib/api";
import type { AdminBlogPostDetail } from "@/types";

export default function AdminBlogEditPage() {
  const params = useParams();
  const id = params.id as string;
  const [post, setPost] = useState<AdminBlogPostDetail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.admin
      .getBlogPost(id)
      .then(({ post: next }) => setPost(next))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Could not load post")
      );
  }, [id]);

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  if (!post) {
    return <p className="text-[var(--text-muted)]">Loading…</p>;
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Edit blog article</h1>
        <p className="text-[var(--text-secondary)] mt-1 font-mono text-sm">
          /blog/{post.slug}
        </p>
      </div>
      <BlogEditor
        mode="edit"
        postId={post.id}
        initial={{
          title: post.title,
          slug: post.slug,
          description: post.description,
          excerpt: post.excerpt,
          tags: post.tags,
          readingMinutes: post.readingMinutes,
          status: post.status,
          sections: post.content.sections,
        }}
      />
    </div>
  );
}
