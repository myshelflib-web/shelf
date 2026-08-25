"use client";

import { useState } from "react";
import Link from "next/link";
import { AdminArticle, Subject } from "@/types";
import { api } from "@/lib/api";
import {
  ExternalLink,
  RefreshCw,
  Trash2,
  Loader2,
  Search,
  Lock,
  LockOpen,
} from "lucide-react";
import clsx from "clsx";

interface TopicsTableProps {
  topics: AdminArticle[];
  subjects: Subject[];
  onUpdate: () => void;
}

const statusStyles: Record<string, string> = {
  PUBLISHED: "bg-green-500/10 text-green-500",
  PROCESSING: "bg-yellow-500/10 text-yellow-500",
  FAILED: "bg-red-500/10 text-red-500",
  DRAFT: "bg-gray-500/10 text-gray-400",
};

export function TopicsTable({ topics, subjects, onUpdate }: TopicsTableProps) {
  const [filterSubject, setFilterSubject] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);

  const filtered = topics.filter((t) => {
    if (filterSubject !== "all" && t.subject.slug !== filterSubject) return false;
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    if (
      search &&
      !t.title.toLowerCase().includes(search.toLowerCase()) &&
      !t.subject.name.toLowerCase().includes(search.toLowerCase()) &&
      !(t.topic?.title ?? "").toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  const handleReprocess = async (id: string) => {
    setActionId(id);
    try {
      await api.admin.reprocessTopic(id);
      onUpdate();
    } catch (err) {
      console.error(err);
    } finally {
      setActionId(null);
    }
  };

  const handleTogglePremium = async (t: AdminArticle) => {
    setActionId(t.id);
    try {
      await api.admin.updateTopic(t.id, { isPremium: !t.isPremium });
      onUpdate();
    } catch (err) {
      console.error(err);
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setActionId(id);
    try {
      await api.admin.deleteTopic(id);
      onUpdate();
    } catch (err) {
      console.error(err);
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search articles..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
        </div>
        <select
          value={filterSubject}
          onChange={(e) => setFilterSubject(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg bg-[var(--bg-primary)] border border-[var(--border)]"
        >
          <option value="all">All Subjects</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.slug}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg bg-[var(--bg-primary)] border border-[var(--border)]"
        >
          <option value="all">All Statuses</option>
          <option value="PUBLISHED">Published</option>
          <option value="PROCESSING">Processing</option>
          <option value="FAILED">Failed</option>
          <option value="DRAFT">Draft</option>
        </select>
      </div>

      <div className="rounded-xl border border-[var(--border)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--bg-secondary)]">
              <th className="text-left px-4 py-3 font-medium text-[var(--text-muted)]">
                Article
              </th>
              <th className="text-left px-4 py-3 font-medium text-[var(--text-muted)] hidden md:table-cell">
                Subject / Topic
              </th>
              <th className="text-left px-4 py-3 font-medium text-[var(--text-muted)]">
                Status
              </th>
              <th className="text-left px-4 py-3 font-medium text-[var(--text-muted)]">
                Premium
              </th>
              <th className="text-right px-4 py-3 font-medium text-[var(--text-muted)]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-[var(--text-muted)]"
                >
                  No articles found
                </td>
              </tr>
            ) : (
              filtered.map((t) => (
                <tr
                  key={t.id}
                  className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--bg-secondary)]/50"
                >
                  <td className="px-4 py-3">
                    <p className="font-medium">{t.title}</p>
                    <p className="text-xs text-[var(--text-muted)]">{t.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)] hidden md:table-cell">
                    {t.subject.name}
                    {t.topic ? ` / ${t.topic.title}` : ""}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={clsx(
                        "text-xs px-2 py-0.5 rounded-full font-medium",
                        statusStyles[t.status] ?? statusStyles.DRAFT
                      )}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleTogglePremium(t)}
                      disabled={actionId === t.id}
                      className={clsx(
                        "flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium transition",
                        t.isPremium
                          ? "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
                          : "bg-gray-500/10 text-gray-400 hover:bg-gray-500/20"
                      )}
                      title={t.isPremium ? "Remove premium" : "Mark as premium"}
                    >
                      {t.isPremium ? (
                        <Lock className="w-3 h-3" />
                      ) : (
                        <LockOpen className="w-3 h-3" />
                      )}
                      {t.isPremium ? "Yes" : "Free"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {t.status === "PUBLISHED" && t.topic && (
                        <Link
                          href={`/learn/${t.subject.slug}/${t.topic.slug}/${t.slug}`}
                          className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--accent)]"
                          title="View article"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      )}
                      {(t.status === "FAILED" || t.status === "PROCESSING") && (
                        <button
                          onClick={() => handleReprocess(t.id)}
                          disabled={actionId === t.id}
                          className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-yellow-500 disabled:opacity-50"
                          title="Reprocess PDF"
                        >
                          {actionId === t.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4" />
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(t.id, t.title)}
                        disabled={actionId === t.id}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-500 disabled:opacity-50"
                        title="Delete article"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-[var(--text-muted)]">
        Showing {filtered.length} of {topics.length} articles
      </p>
    </div>
  );
}
