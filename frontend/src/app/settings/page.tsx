"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { LivelyLine } from "@/components/LivelyLine";
import { AccountNav } from "@/components/AccountNav";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { api } from "@/lib/api";
import { STUDY_GOAL_GROUPS, STUDY_GOAL_LABELS, normalizeStudyGoal } from "@/lib/studyGoal";
import { ReadingGoalPicker } from "@/components/dashboard/ReadingGoalPicker";
import { getReadingGoalMinutes } from "@/lib/readingStats";
import { AffiliateSettingsCard } from "@/components/settings/AffiliateSettingsCard";
import { TelegramSettingsCard } from "@/components/settings/TelegramSettingsCard";
import { StudyGoal } from "@/types";

function UsageMeter({
  label,
  used,
  limit,
  format,
}: {
  label: string;
  used: number;
  limit: number;
  format: (n: number) => string;
}) {
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1.5">
        <span className="font-medium">{label}</span>
        <span className="text-[var(--text-muted)] text-xs">
          {format(used)} / {format(limit)}
        </span>
      </div>
      <div className="h-2 rounded-full bg-[var(--border)] overflow-hidden">
        <div
          className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[11px] text-[var(--text-muted)] mt-1">
        {Math.max(0, 100 - pct)}% remaining
      </p>
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading: authLoading, refreshUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const [goal, setGoal] = useState<StudyGoal>("GENERAL");
  const [readingGoalMin, setReadingGoalMin] = useState(45);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    setGoal(normalizeStudyGoal(user.studyGoal));
    setReadingGoalMin(getReadingGoalMinutes());
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className="h-full flex items-center justify-center text-[var(--text-muted)]">
        Loading...
      </div>
    );
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);
    try {
      await api.auth.updateMe({ studyGoal: goal });
      await refreshUser();
      setMessage("Saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto flex flex-col">
      <Header />
      <main className="flex-1 px-5 sm:px-6 py-8 max-w-xl mx-auto w-full">
        <h1 className="page-title mb-1">App settings</h1>
        <LivelyLine surface="settings" className="page-subtitle mb-4" />
        <AccountNav current="settings" />

        <form onSubmit={save} className="space-y-6">
          <section className="p-5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] space-y-4">
            <h2 className="text-sm font-semibold">Preferences</h2>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Daily reading goal
              </label>
              <ReadingGoalPicker
                value={readingGoalMin}
                onChange={setReadingGoalMin}
              />
              <p className="text-xs text-[var(--text-muted)] mt-1.5">
                Shown on your dashboard reading ring.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Study goal</label>
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value as StudyGoal)}
                className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              >
                {STUDY_GOAL_GROUPS.map((group) => (
                  <optgroup key={group.label} label={group.label}>
                    {group.options.map((value) => (
                      <option key={value} value={value}>
                        {STUDY_GOAL_LABELS[value]}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <p className="text-xs text-[var(--text-muted)] mt-1.5">
                Study AI uses this so answers stay on track. Non-General goals
                unlock a Preloaded library on Library.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Theme</label>
              <select
                value={theme}
                onChange={(e) =>
                  setTheme(e.target.value === "light" ? "light" : "dark")
                }
                className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </select>
            </div>
          </section>

          <section className="p-5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] space-y-4">
            <h2 className="text-sm font-semibold">Plan usage</h2>
            <p className="text-xs text-[var(--text-muted)]">
              {user.plan === "PREMIUM" || user.role === "ADMIN"
                ? "Your paid plan limits."
                : "Free plan limits — upgrade for more."}
            </p>
            <UsageMeter
              label="Upload storage"
              used={user.storageUsedBytes ?? 0}
              limit={user.storageLimitBytes ?? 250 * 1024 * 1024}
              format={(n) =>
                n >= 1024 * 1024 * 1024
                  ? `${(n / (1024 * 1024 * 1024)).toFixed(1)} GB`
                  : `${Math.round(n / (1024 * 1024))} MB`
              }
            />
            <UsageMeter
              label="Study AI tokens (this month)"
              used={user.llmTokensUsed ?? 0}
              limit={user.llmTokenLimit ?? 50_000}
              format={(n) => n.toLocaleString()}
            />
            {!(user.plan === "PREMIUM" || user.role === "ADMIN") && (
              <Link href="/subscribe" className="text-sm text-[var(--accent)] inline-block">
                Upgrade for more storage and tokens
              </Link>
            )}
          </section>

          {error && <p className="text-sm text-red-500">{error}</p>}
          {message && <p className="text-sm text-[var(--accent)]">{message}</p>}

          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-sm font-medium disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </form>

        <div className="mt-6 space-y-6">
          <TelegramSettingsCard />
          <AffiliateSettingsCard />
        </div>
      </main>
    </div>
  );
}
