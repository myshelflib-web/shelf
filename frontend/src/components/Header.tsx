"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { isPremiumUser } from "@/lib/premium";
import { avatarSrc } from "@/lib/avatar";
import { ShelfLogo } from "@/components/ShelfLogo";
import { useHotkeysController } from "@/hooks/useHotkeys";
import { useLibraryHref, shouldSkipLibraryNav } from "@/hooks/useLibraryHref";
import { getLibraryHref } from "@/components/my-content/reader/types";
import { withShortcut } from "@/lib/hotkeys";
import { useTouchPrimaryUi } from "@/hooks/useTouchPrimaryUi";
import {
  Moon,
  Sun,
  Sparkles,
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  MessageSquareText,
  ListChecks,
  Search,
  Keyboard,
  Shield,
  Newspaper,
  Info,
  type LucideIcon,
} from "lucide-react";
import { StreakPopover } from "@/components/StreakPopover";
import { ProfileMenu } from "@/components/ProfileMenu";
import { NotificationsPopover } from "@/components/NotificationsPopover";
import { OfflineStatusBadge } from "@/components/OfflineStatusBadge";

function NavItem({
  href,
  icon: Icon,
  children,
  className = "",
  onNavigate,
}: {
  href: string;
  icon: LucideIcon;
  children: React.ReactNode;
  className?: string;
  onNavigate?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}) {
  return (
    <NavLink href={href} onNavigate={onNavigate} className={className}>
      <Icon className="nav-link-icon" aria-hidden />
      {children}
    </NavLink>
  );
}

function NavLink({
  href,
  children,
  className = "",
  onNavigate,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  onNavigate?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}) {
  const pathname = usePathname();
  const [hash, setHash] = useState("");

  useEffect(() => {
    const sync = () => setHash(window.location.hash);
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [pathname]);

  const [path, hrefHash] = href.split("#");
  const wantHash = hrefHash ? `#${hrefHash}` : "";
  let active = false;
  if (wantHash) {
    active = pathname === path && hash === wantHash;
  } else if (path === "/dashboard") {
    active = pathname === "/dashboard";
  } else if (path === "/my-content" || path.startsWith("/my-content/")) {
    // Library link may point at a focused reader tab; keep nav active for all library routes.
    active =
      pathname === "/my-content" || pathname.startsWith("/my-content/");
  } else {
    active =
      pathname === path || (path !== "/" && pathname.startsWith(path));
  }

  return (
    <Link
      href={href}
      onClick={(e) => {
        onNavigate?.(e);
        if (e.defaultPrevented) return;
        if (wantHash) setHash(wantHash);
        else if (path === "/dashboard") setHash("");
      }}
      className={`nav-link relative ${active ? "nav-link-active" : ""} ${className}`}
    >
      {children}
    </Link>
  );
}

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const premium = isPremiumUser(user);
  const photo = user ? avatarSrc(user) : null;
  const [profileOpen, setProfileOpen] = useState(false);
  const { openSearch, openHelp } = useHotkeysController();
  const touchPrimary = useTouchPrimaryUi();
  const searchTitle = touchPrimary
    ? "Search library"
    : withShortcut("Search library", "mod+k");
  const libraryHref = useLibraryHref();

  const onLibraryClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const next = getLibraryHref();
    if (shouldSkipLibraryNav(next)) {
      e.preventDefault();
    }
  };

  return (
    <>
    <header className="app-header shrink-0 border-b border-[var(--border)] bg-[var(--bg-primary)] sticky top-0 z-50">
      <div className="app-header-inner flex items-center justify-between gap-4 w-full px-5 sm:px-6">
        <div className="flex items-center gap-6 min-w-0">
          <Link
            href={user ? libraryHref : "/"}
            onClick={user ? onLibraryClick : undefined}
            className="flex items-center gap-2.5 shrink-0 hover:opacity-90 transition-opacity"
          >
            <ShelfLogo size={26} />
            <span className="font-semibold text-[17px] tracking-tight text-[var(--text-primary)]">
              Shelf
            </span>
          </Link>

          <nav
            className={`items-center gap-1 text-[13px] text-[var(--text-secondary)] ${
              user ? "hidden md:flex" : "flex"
            }`}
          >
            {user ? (
              <>
                <NavItem
                  href={libraryHref}
                  icon={BookOpen}
                  onNavigate={onLibraryClick}
                >
                  Library
                </NavItem>
                <NavItem href="/dashboard" icon={LayoutDashboard}>
                  Dashboard
                </NavItem>
                <NavItem href="/planner" icon={CalendarDays}>
                  Planner
                </NavItem>
                <NavItem href="/quiz" icon={ListChecks}>
                  Quiz
                </NavItem>
                <NavItem href="/study-ai" icon={MessageSquareText}>
                  Study AI
                </NavItem>
              </>
            ) : (
              <>
                <NavItem href="/learn" icon={BookOpen}>
                  Library
                </NavItem>
                <NavItem href="/blog" icon={Newspaper}>
                  Blog
                </NavItem>
                <NavItem href="/quiz" icon={ListChecks}>
                  Quiz
                </NavItem>
                <NavItem href="/about" icon={Info}>
                  About
                </NavItem>
              </>
            )}
            {user?.role === "ADMIN" && (
              <NavItem href="/admin" icon={Shield} className="hidden lg:inline-flex">
                Admin
              </NavItem>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {user && (
            <>
            <button
              type="button"
              onClick={openSearch}
              className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
              aria-label="Search library"
              title={searchTitle}
              aria-keyshortcuts={
                touchPrimary ? undefined : "Meta+K Control+K Slash"
              }
            >
              <Search className="w-4 h-4" />
            </button>
            {!touchPrimary && (
            <button
              type="button"
              onClick={openHelp}
              className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
              aria-label="Keyboard shortcuts"
              title={withShortcut("Keyboard shortcuts", "?")}
            >
              <Keyboard className="w-4 h-4" />
            </button>
            )}
            </>
          )}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
            aria-label="Toggle theme"
            title="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>

          {user ? (
            <>
              {!premium && (
                <Link
                  href="/subscribe"
                  className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-full bg-[var(--accent-subtle)] text-[var(--accent)] text-sm font-medium hover:bg-[var(--accent-light)] transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Upgrade
                </Link>
              )}
              <OfflineStatusBadge />
              <StreakPopover />
              <NotificationsPopover />
              <button
                type="button"
                onClick={() => setProfileOpen(true)}
                title="Account"
                className="shrink-0"
              >
                {photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photo}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover ring-1 ring-[var(--border)]"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-sm font-medium">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="nav-link hidden sm:inline text-sm px-2">
                Sign in
              </Link>
              <Link href="/contact" className="btn-secondary hidden sm:inline-flex text-sm py-2">
                Contact us
              </Link>
              <Link href="/subscribe" className="btn-primary text-sm py-2">
                Plans
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
    {user && profileOpen && (
      <ProfileMenu
        user={user}
        onClose={() => setProfileOpen(false)}
        onLogout={logout}
      />
    )}
    </>
  );
}
