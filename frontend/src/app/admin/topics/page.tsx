"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { TopicsTable } from "@/components/admin/TopicsTable";
import { api } from "@/lib/api";
import { AdminTopic, Subject } from "@/types";
import { Plus, RefreshCw } from "lucide-react";

export default function AdminTopicsPage() {
  const [topics, setTopics] = useState<AdminTopic[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([api.admin.listTopics(), api.subjects.list()])
      .then(([{ topics }, { subjects }]) => {
        setTopics(topics);
        setSubjects(subjects);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Auto-refresh while any topic is processing
  useEffect(() => {
    const hasProcessing = topics.some((t) => t.status === "PROCESSING");
    if (!hasProcessing) return;

    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [topics, load]);

  return (
    <div className="max-w-5xl">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Manage Articles</h1>
          <p className="text-[var(--text-secondary)] mt-1">
            View and manage articles across subjects and topics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[var(--border)] text-sm hover:bg-[var(--bg-secondary)] transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <Link
            href="/admin/upload"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--accent)] text-white text-sm hover:bg-[var(--accent-hover)] transition"
          >
            <Plus className="w-4 h-4" />
            Upload PDF
          </Link>
        </div>
      </div>

      {loading && topics.length === 0 ? (
        <div className="text-center py-12 text-[var(--text-muted)]">
          Loading articles...
        </div>
      ) : (
        <TopicsTable topics={topics} subjects={subjects} onUpdate={load} />
      )}
    </div>
  );
}
