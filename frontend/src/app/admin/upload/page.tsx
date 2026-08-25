"use client";

import { useEffect, useState } from "react";
import { UploadForm } from "@/components/admin/UploadForm";
import { api } from "@/lib/api";
import { Subject } from "@/types";

export default function AdminUploadPage() {
  const [subjects, setSubjects] = useState<Subject[] | null>(null);

  useEffect(() => {
    api.admin.hierarchy().then(({ subjects }) => setSubjects(subjects));
  }, []);

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Upload PDF</h1>
        <p className="text-[var(--text-secondary)] mt-1">
          Choose or create subject → topic → article, then upload a PDF
        </p>
      </div>

      <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]">
        {subjects ? (
          <UploadForm subjects={subjects} />
        ) : (
          <p className="text-[var(--text-muted)]">Loading subjects...</p>
        )}
      </div>

      <div className="mt-6 p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]">
        <h3 className="text-sm font-semibold mb-2">How it works</h3>
        <ol className="text-sm text-[var(--text-secondary)] space-y-1.5 list-decimal list-inside">
          <li>Pick existing subject/topic/article or type a new name</li>
          <li>PDF is uploaded to S3 under that hierarchy</li>
          <li>Processor converts PDF → HTML and publishes the article</li>
          <li>Students open /learn/subject/topic/article to study</li>
        </ol>
      </div>
    </div>
  );
}
