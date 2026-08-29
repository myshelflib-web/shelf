"use client";

import { BulkImportForm } from "@/components/admin/BulkImportForm";

export default function AdminBulkUploadPage() {
  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Bulk curriculum import</h1>
        <p className="text-[var(--text-secondary)] mt-1">
          Import structured curriculum for any exam goal, then attach PDFs in bulk.
        </p>
      </div>
      <BulkImportForm />
      <div className="mt-8 p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-sm text-[var(--text-secondary)] space-y-2">
        <p className="font-semibold text-[var(--text-primary)]">SEO tips</p>
        <ul className="list-disc list-inside space-y-1">
          <li>
            Use clear subject and article titles — they become page titles on
            /learn.
          </li>
          <li>
            Fill <code className="text-xs">subjectDescription</code> for richer
            subject pages.
          </li>
          <li>
            Published articles are included in sitemap.xml automatically.
          </li>
          <li>
            Set article status to Published in Manage Articles after processing.
          </li>
        </ul>
      </div>
    </div>
  );
}
