"use client";

import { AdminStats } from "@/types";
import {
  BookOpen,
  CheckCircle2,
  Loader2,
  AlertCircle,
  FolderOpen,
} from "lucide-react";

export function StatsCards({ stats }: { stats: AdminStats }) {
  const cards = [
    {
      label: "Total Topics",
      value: stats.totalTopics,
      icon: BookOpen,
      color: "text-blue-500 bg-blue-500/10",
    },
    {
      label: "Published",
      value: stats.published,
      icon: CheckCircle2,
      color: "text-green-500 bg-green-500/10",
    },
    {
      label: "Processing",
      value: stats.processing,
      icon: Loader2,
      color: "text-yellow-500 bg-yellow-500/10",
    },
    {
      label: "Failed",
      value: stats.failed,
      icon: AlertCircle,
      color: "text-red-500 bg-red-500/10",
    },
    {
      label: "Subjects",
      value: stats.subjects,
      icon: FolderOpen,
      color: "text-purple-500 bg-purple-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map(({ label, value, icon: Icon, color }) => (
        <div
          key={label}
          className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]"
        >
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${color}`}>
            <Icon className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">{label}</p>
        </div>
      ))}
    </div>
  );
}
