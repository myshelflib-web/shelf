"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, type LucideIcon } from "lucide-react";

export type HeaderMobileNavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
  onNavigate?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
};

export function HeaderMenuButton({
  open,
  onClick,
}: {
  open: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="md:hidden p-2 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
      aria-label={open ? "Close menu" : "Open menu"}
      aria-expanded={open}
    >
      {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
    </button>
  );
}

function MobileNavLink({
  href,
  icon: Icon,
  label,
  onNavigate,
  onClose,
}: HeaderMobileNavItem & { onClose: () => void }) {
  const pathname = usePathname();
  const [path, hashPart] = href.split("#");
  const active =
    hashPart === undefined
      ? pathname === path ||
        (path !== "/" && path.length > 1 && pathname.startsWith(path))
      : pathname === path;

  return (
    <Link
      href={href}
      onClick={(e) => {
        onNavigate?.(e);
        if (!e.defaultPrevented) onClose();
      }}
      className={`flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[15px] font-medium transition-colors ${
        active
          ? "bg-[var(--accent-light)] text-[var(--accent)]"
          : "text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
      }`}
    >
      <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
      {label}
    </Link>
  );
}

export function HeaderMobileNav({
  open,
  onClose,
  items,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  items: HeaderMobileNavItem[];
  footer?: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Close menu"
        className="fixed inset-0 z-[58] bg-black/45 md:hidden"
        onClick={onClose}
      />
      <nav
        className="fixed top-12 left-0 right-0 z-[59] max-h-[calc(100dvh-3rem)] overflow-y-auto border-b border-[var(--border)] bg-[var(--bg-elevated)] shadow-lg md:hidden"
        aria-label="Main navigation"
      >
        <div className="flex flex-col gap-0.5 p-3">
          {items.map((item) => (
            <MobileNavLink key={item.href + item.label} {...item} onClose={onClose} />
          ))}
        </div>
        {footer ? (
          <div className="border-t border-[var(--border-subtle)] p-3 flex flex-col gap-2">
            {footer}
          </div>
        ) : null}
      </nav>
    </>
  );
}
