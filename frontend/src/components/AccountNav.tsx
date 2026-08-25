"use client";

import Link from "next/link";

export function AccountNav({ current }: { current: "settings" | "profile" }) {
  const item = (href: string, id: "settings" | "profile", label: string) => (
    <Link
      href={href}
      className={`px-3 py-1.5 rounded-md text-sm ${
        current === id
          ? "bg-[var(--bg-elevated)] text-[var(--text-primary)]"
          : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <div className="inline-flex gap-0.5 p-0.5 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] mb-6">
      {item("/settings", "settings", "App settings")}
      {item("/profile", "profile", "Profile")}
    </div>
  );
}
