"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import type { AdminBlogSection } from "@/types";
import { ShelfSelect } from "@/components/ui/ShelfSelect";

type BlogEditorProps = {
  mode: "create" | "edit";
  postId?: string;
  initial?: {
    title: string;
    slug: string;
    description: string;
    excerpt: string;
    tags: string[];
    readingMinutes: number;
    status: "DRAFT" | "PUBLISHED";
    sections: AdminBlogSection[];
  };
};

const emptySection = (): AdminBlogSection => ({
  heading: "",
  paragraphs: [""],
  bullets: [],
});

export function BlogEditor({ mode, postId, initial }: BlogEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [tags, setTags] = useState(initial?.tags.join(", ") ?? "");
  const [readingMinutes, setReadingMinutes] = useState(initial?.readingMinutes ?? 5);
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">(
    initial?.status ?? "DRAFT"
  );
  const [sections, setSections] = useState<AdminBlogSection[]>(
    initial?.sections?.length ? initial.sections : [emptySection()]
  );
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const updateSection = (index: number, patch: Partial<AdminBlogSection>) => {
    setSections((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...patch } : s))
    );
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        slug: slug.trim(),
        description: description.trim(),
        excerpt: excerpt.trim(),
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        readingMinutes,
        status,
        sections: sections.map((s) => ({
          heading: s.heading?.trim() || undefined,
          paragraphs: s.paragraphs.map((p) => p.trim()).filter(Boolean),
          bullets: s.bullets?.map((b) => b.trim()).filter(Boolean),
        })),
      };

      let id = postId;
      if (mode === "create") {
        const { post } = await api.admin.createBlogPost(payload);
        id = post.id;
      } else if (postId) {
        await api.admin.updateBlogPost(postId, payload);
      }

      if (coverFile && id) {
        await api.admin.uploadBlogCover(id, coverFile);
      }

      router.push("/admin/blog");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="max-w-3xl space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="text-sm font-medium mb-1.5 block">Title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)]"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium mb-1.5 block">Slug</span>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="auto-from-title"
            className="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] font-mono text-sm"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium mb-1.5 block">Status</span>
          <ShelfSelect
            value={status}
            options={[
              { value: "DRAFT", label: "Draft" },
              { value: "PUBLISHED", label: "Published" },
            ]}
            className="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)]"
            aria-label="Status"
            onChange={(v) => setStatus(v as "DRAFT" | "PUBLISHED")}
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-sm font-medium mb-1.5 block">SEO description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={2}
            className="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)]"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-sm font-medium mb-1.5 block">Excerpt</span>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            required
            rows={2}
            className="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)]"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium mb-1.5 block">Tags (comma-separated)</span>
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)]"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium mb-1.5 block">Reading minutes</span>
          <input
            type="number"
            min={1}
            max={60}
            value={readingMinutes}
            onChange={(e) => setReadingMinutes(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)]"
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="text-sm font-medium mb-1.5 block">Cover image (optional)</span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
            className="text-sm"
          />
        </label>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Sections</h2>
          <button
            type="button"
            onClick={() => setSections((s) => [...s, emptySection()])}
            className="text-sm text-[var(--accent)] hover:underline"
          >
            + Add section
          </button>
        </div>
        {sections.map((section, i) => (
          <div
            key={i}
            className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] space-y-3"
          >
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-[var(--text-muted)]">
                Section {i + 1}
              </span>
              {sections.length > 1 && (
                <button
                  type="button"
                  onClick={() => setSections((s) => s.filter((_, j) => j !== i))}
                  className="text-xs text-red-500 hover:underline"
                >
                  Remove
                </button>
              )}
            </div>
            <input
              value={section.heading ?? ""}
              onChange={(e) => updateSection(i, { heading: e.target.value })}
              placeholder="Heading"
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)]"
            />
            <textarea
              value={section.paragraphs.join("\n\n")}
              onChange={(e) =>
                updateSection(i, {
                  paragraphs: e.target.value.split(/\n\n+/).filter(Boolean),
                })
              }
              placeholder="Paragraphs (blank line between)"
              rows={4}
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] text-sm"
            />
            <textarea
              value={(section.bullets ?? []).join("\n")}
              onChange={(e) =>
                updateSection(i, {
                  bullets: e.target.value.split("\n").filter(Boolean),
                })
              }
              placeholder="Bullet points (one per line)"
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] text-sm"
            />
          </div>
        ))}
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-500/10 px-3 py-2 rounded-lg">{error}</p>
      )}

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
          {saving ? "Saving…" : mode === "create" ? "Publish to S3" : "Save changes"}
        </button>
        <Link href="/admin/blog" className="btn-secondary">
          Cancel
        </Link>
      </div>
    </form>
  );
}
