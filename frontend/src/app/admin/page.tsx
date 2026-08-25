"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatsCards } from "@/components/admin/StatsCards";
import { api } from "@/lib/api";
import { AdminStats, AdminTopic } from "@/types";
import { Upload, ArrowRight, FileText } from "lucide-react";
import clsx from "clsx";

const statusStyles: Record<string, string> = {
  PUBLISHED: "bg-green-500/10 text-green-500",
  PROCESSING: "bg-yellow-500/10 text-yellow-500",
  FAILED: "bg-red-500/10 text-red-500",
  DRAFT: "bg-gray-500/10 text-gray-400",
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [recentTopics, setRecentTopics] = useState<AdminTopic[]>([]);

  useEffect(() => {
    api.admin.stats().then(({ stats, recentTopics }) => {
      setStats(stats);
      setRecentTopics(recentTopics);
    });
  }, []);

  return (
    <div className="max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-[var(--text-secondary)] mt-1">
          Overview of your study library
        </p>
      </div>

      {stats && <StatsCards stats={stats} />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 mb-8">
        <Link
          href="/admin/upload"
          className="flex items-center gap-4 p-5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--accent)] transition group"
        >
          <div className="w-12 h-12 rounded-xl bg-[var(--accent-light)] flex items-center justify-center">
            <Upload className="w-6 h-6 text-[var(--accent)]" />
          </div>
          <div className="flex-1">
            <p className="font-semibold group-hover:text-[var(--accent)] transition">
              Upload PDF
            </p>
            <p className="text-sm text-[var(--text-muted)]">
              Add new study material by subject
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--accent)]" />
        </Link>

        <Link
          href="/admin/topics"
          className="flex items-center gap-4 p-5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--accent)] transition group"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <FileText className="w-6 h-6 text-blue-500" />
          </div>
          <div className="flex-1">
            <p className="font-semibold group-hover:text-[var(--accent)] transition">
              Manage Articles
            </p>
            <p className="text-sm text-[var(--text-muted)]">
              View, reprocess, or delete articles
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--accent)]" />
        </Link>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Recent Uploads</h2>
        {recentTopics.length === 0 ? (
          <div className="p-8 rounded-xl border border-dashed border-[var(--border)] text-center text-[var(--text-muted)]">
            No topics yet.{" "}
            <Link href="/admin/upload" className="text-[var(--accent)] hover:underline">
              Upload your first PDF
            </Link>
          </div>
        ) : (
          <div className="rounded-xl border border-[var(--border)] divide-y divide-[var(--border)]">
            {recentTopics.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-4 px-4 py-3 hover:bg-[var(--bg-secondary)]/50"
              >
                <FileText className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{t.title}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {t.subject.name}
                    {t.topic ? ` / ${t.topic.title}` : ""}
                  </p>
                </div>
                <span
                  className={clsx(
                    "text-xs px-2 py-0.5 rounded-full font-medium shrink-0",
                    statusStyles[t.status] ?? statusStyles.DRAFT
                  )}
                >
                  {t.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
