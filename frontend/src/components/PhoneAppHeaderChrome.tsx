"use client";

import { Ellipsis, Search } from "lucide-react";

/**
 * Signed-in phone app header — page title + Search + overflow.
 * No Shelf wordmark/logo on every screen (native-app pattern).
 */
export function PhoneAppHeaderBrand({ title }: { title: string }) {
  return (
    <div className="app-header-brand phone-app-header-brand min-w-0 flex items-center">
      <h1 className="phone-app-header-title truncate">{title}</h1>
    </div>
  );
}

export function PhoneAppHeaderActions({
  onSearch,
  moreOpen,
  onMoreClick,
}: {
  onSearch: () => void;
  moreOpen: boolean;
  onMoreClick: () => void;
}) {
  return (
    <div className="app-header-actions app-header-actions-phone">
      <button
        type="button"
        onClick={onSearch}
        className="phone-hdr-icon-btn"
        aria-label="Search library"
        data-tour-id="hdr-search"
      >
        <Search className="h-5 w-5" aria-hidden />
      </button>
      <button
        type="button"
        onClick={onMoreClick}
        className="phone-hdr-icon-btn"
        aria-label={moreOpen ? "Close menu" : "Open menu"}
        aria-expanded={moreOpen}
        data-tour-id="hdr-phone-more"
      >
        <Ellipsis className="h-5 w-5" aria-hidden />
      </button>
    </div>
  );
}

export function phoneHeaderTitle(pathname: string): string {
  if (pathname === "/dashboard") return "Home";
  if (pathname === "/planner" || pathname.startsWith("/planner")) return "Planner";
  if (pathname === "/study-ai" || pathname.startsWith("/study-ai/")) return "Study AI";
  if (pathname === "/quiz" || pathname.startsWith("/quiz/")) return "Quiz";
  if (pathname === "/settings") return "Settings";
  if (pathname === "/profile") return "Profile";
  if (pathname === "/my-content" || pathname.startsWith("/my-content/")) {
    // Reader routes keep Library as the section name; doc title lives in reader chrome.
    return "Library";
  }
  return "Shelf";
}
