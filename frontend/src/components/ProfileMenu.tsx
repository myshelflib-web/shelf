"use client";

import { useEffect } from "react";
import Link from "next/link";
import { LogOut, Settings, UserRound } from "lucide-react";
import { User } from "@/types";
import { avatarSrc } from "@/lib/avatar";

export function ProfileMenu({
  user,
  onClose,
  onLogout,
}: {
  user: User;
  onClose: () => void;
  onLogout: () => void;
}) {
  const photo = avatarSrc(user);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-end pt-14 pr-5 sm:pr-6">
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        aria-label="Close profile"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Account"
        className="relative w-72 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 shadow-xl"
      >
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[var(--border)]">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo}
              alt=""
              className="w-11 h-11 rounded-full object-cover ring-1 ring-[var(--border)]"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-11 h-11 rounded-full bg-[var(--accent)] flex items-center justify-center text-white font-medium">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{user.name}</p>
            <p className="text-[12px] text-[var(--text-muted)] truncate">{user.email}</p>
          </div>
        </div>
        <nav className="space-y-0.5">
          <Link
            href="/profile"
            onClick={onClose}
            className="flex items-center gap-2 px-2 py-2 rounded-md text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
          >
            <UserRound className="w-4 h-4" />
            Profile
          </Link>
          <Link
            href="/settings"
            onClick={onClose}
            className="flex items-center gap-2 px-2 py-2 rounded-md text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
          >
            <Settings className="w-4 h-4" />
            App settings
          </Link>
          <button
            type="button"
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="w-full flex items-center gap-2 px-2 py-2 rounded-md text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]"
          >
            <LogOut className="w-4 h-4" />
            Log out
          </button>
        </nav>
      </div>
    </div>
  );
}
