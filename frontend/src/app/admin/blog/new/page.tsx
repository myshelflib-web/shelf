import { BlogEditor } from "@/components/admin/BlogEditor";

export default function AdminBlogNewPage() {
  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">New blog article</h1>
        <p className="text-[var(--text-secondary)] mt-1">
          Content and section illustrations are saved to S3 on publish.
        </p>
      </div>
      <BlogEditor mode="create" />
    </div>
  );
}
