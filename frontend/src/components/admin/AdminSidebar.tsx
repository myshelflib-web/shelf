"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  LayoutDashboard,
  Upload,
  FileText,
  BookOpen,
  ArrowLeft,
} from "lucide-react";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/upload", label: "Upload PDFs", icon: Upload },
  { href: "/admin/topics", label: "Manage Articles", icon: FileText },
  { href: "/admin/blog", label: "Blog", icon: BookOpen },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 border-r border-[var(--border)] bg-[var(--bg-sidebar)] flex flex-col shrink-0">
      <div className="p-4 border-b border-[var(--border)]">
        <Link
          href="/"
          className="flex items-center gap-2 text-xs text-[var(--text-muted)] hover:text-[var(--accent)] mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to site
        </Link>
        <h2 className="font-semibold text-sm">Admin Dashboard</h2>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">
          Content management
        </p>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {links.map(({ href, label, icon: Icon, exact }) => {
          const active = exact
            ? pathname === href
            : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition",
                active
                  ? "bg-[var(--accent-light)] text-[var(--accent)] font-medium"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
