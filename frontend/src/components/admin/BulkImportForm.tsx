"use client";

import { useCallback, useState } from "react";
import { api } from "@/lib/api";
import { FileUp, Loader2, Upload } from "lucide-react";

export function BulkImportForm() {
  const [manifest, setManifest] = useState<File | null>(null);
  const [pdfs, setPdfs] = useState<File[]>([]);
  const [busy, setBusy] = useState<"manifest" | "pdfs" | null>(null);
  const [message, setMessage] = useState("");

  const downloadTemplate = useCallback(async () => {
    const token = localStorage.getItem("token");
    const base =
      process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
      "http://localhost:4000";
    const res = await fetch(`${base}/api/admin/bulk-import/template`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      setMessage("Could not download template");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "shelf-curriculum-manifest.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const importManifest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manifest) return;
    setBusy("manifest");
    setMessage("");
    try {
      const result = await api.admin.bulkImport(manifest);
      const parts = [
        `${result.subjectsCreated} subjects`,
        `${result.topicsCreated} topics`,
        `${result.articlesCreated} articles created`,
        result.articlesUpdated
          ? `${result.articlesUpdated} updated`
          : null,
      ].filter(Boolean);
      const errs = [...(result.parseErrors ?? []), ...(result.errors ?? [])];
      setMessage(
        `${parts.join(", ")}.${errs.length ? ` ${errs.length} row warning(s).` : ""} ${result.message}`
      );
      setManifest(null);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Import failed");
    } finally {
      setBusy(null);
    }
  };

  const uploadPdfs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfs.length) return;
    setBusy("pdfs");
    setMessage("");
    try {
      const result = await api.admin.bulkUploadPdfs(pdfs);
      setMessage(
        `Uploaded ${result.count} PDF(s).${
          result.errors.length
            ? ` ${result.errors.length} failed — check filenames.`
            : ""
        }`
      );
      setPdfs([]);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Bulk PDF upload failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">1. Import manifest (CSV)</h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1 max-w-xl">
              Create subjects, topics, and article slots grouped by{" "}
              <code className="text-xs">studyGoal</code>. Students see them on
              /learn under the matching exam track.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void downloadTemplate()}
            className="text-sm text-[var(--accent)] hover:underline"
          >
            Download CSV template
          </button>
        </div>
        <p className="text-xs text-[var(--text-muted)] font-mono bg-[var(--bg-primary)] p-3 rounded-lg overflow-x-auto">
          studyGoal,subjectName,topicName,articleTitle,subjectIcon,subjectDescription,articleSlug,publish
        </p>
        <form onSubmit={importManifest} className="space-y-3">
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => setManifest(e.target.files?.[0] ?? null)}
            className="block w-full text-sm"
          />
          <button
            type="submit"
            disabled={!manifest || busy !== null}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-medium disabled:opacity-50"
          >
            {busy === "manifest" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            Import hierarchy
          </button>
        </form>
      </div>

      <div className="p-6 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] space-y-4">
        <h2 className="text-lg font-semibold">2. Bulk upload PDFs</h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Name each file{" "}
          <code className="text-xs">subjectSlug--topicSlug--articleSlug.pdf</code>{" "}
          (slugs from /learn URLs). Articles are created if missing, then queued
          for processing.
        </p>
        <form onSubmit={uploadPdfs} className="space-y-3">
          <input
            type="file"
            accept="application/pdf"
            multiple
            onChange={(e) => setPdfs(Array.from(e.target.files ?? []))}
            className="block w-full text-sm"
          />
          {pdfs.length > 0 && (
            <p className="text-xs text-[var(--text-muted)]">
              {pdfs.length} file(s) selected
            </p>
          )}
          <button
            type="submit"
            disabled={!pdfs.length || busy !== null}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-medium disabled:opacity-50"
          >
            {busy === "pdfs" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileUp className="w-4 h-4" />
            )}
            Upload PDFs
          </button>
        </form>
      </div>

      {message && (
        <p className="text-sm px-3 py-2 rounded-lg bg-[var(--accent-light)] text-[var(--accent)]">
          {message}
        </p>
      )}
    </div>
  );
}
