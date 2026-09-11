"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  BookOpen,
  LayoutDashboard,
  CalendarDays,
  MessageSquareText,
  Ellipsis,
  type LucideIcon,
} from "lucide-react";
import { useIsPhone } from "@/hooks/useIsPhone";
import { useAuth } from "@/hooks/useAuth";

type Tab = {
  href: string;
  label: string;
  icon: LucideIcon;
  match: (pathname: string) => boolean;
  onNavigate?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
};

/**
 * Signed-in phone primary nav. Desktop/tablet unchanged (hidden via CSS + useIsPhone).
 */
export function PhoneBottomNav({
  moreOpen,
  onMoreClick,
}: {
  moreOpen?: boolean;
  onMoreClick?: () => void;
}) {
  const phone = useIsPhone();
  const { user } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    if (!phone || !user) return;
    const root = document.documentElement;
    root.dataset.shelfPhoneTabs = "";
    return () => {
      delete root.dataset.shelfPhoneTabs;
    };
  }, [phone, user]);

  if (!phone || !user) return null;

  const tabs: Tab[] = [
    {
      href: "/my-content",
      label: "Library",
      icon: BookOpen,
      match: (p) => p === "/my-content" || p.startsWith("/my-content/"),
    },
    {
      href: "/dashboard",
      label: "Home",
      icon: LayoutDashboard,
      match: (p) => p === "/dashboard",
    },
    {
      href: "/planner",
      label: "Planner",
      icon: CalendarDays,
      match: (p) => p === "/planner" || p.startsWith("/planner"),
    },
    {
      href: "/study-ai",
      label: "Study AI",
      icon: MessageSquareText,
      match: (p) => p === "/study-ai" || p.startsWith("/study-ai/"),
    },
  ];

  return (
    <nav
      className="phone-bottom-nav md:hidden"
      aria-label="Primary"
      data-tour-id="phone-bottom-nav"
    >
      <div className="phone-bottom-nav-inner">
        {tabs.map(({ href, label, icon: Icon, match, onNavigate }) => {
          const active = match(pathname);
          return (
            <Link
              key={label}
              href={href}
              onClick={onNavigate}
              className={`phone-bottom-nav-item${active ? " phone-bottom-nav-item-active" : ""}`}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-5 w-5" aria-hidden />
              <span>{label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          className={`phone-bottom-nav-item${moreOpen ? " phone-bottom-nav-item-active" : ""}`}
          aria-label="More"
          aria-expanded={moreOpen}
          onClick={onMoreClick}
          data-tour-id="phone-nav-more"
        >
          <Ellipsis className="h-5 w-5" aria-hidden />
          <span>More</span>
        </button>
      </div>
    </nav>
  );
}
