"use client";

import { useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useHotkey, useHotkeysController } from "@/hooks/useHotkeys";
import { SearchModal } from "@/components/SearchModal";
import { HotkeysHelpModal } from "@/components/HotkeysHelpModal";
import type { AddModalKind } from "@/components/my-content/MyContentAddModal";
import { getLibraryHref } from "@/components/my-content/reader/types";
import { SHELF_OPEN_ADD } from "@/lib/hotkeys";

function openAdd(kind: AddModalKind) {
  window.dispatchEvent(
    new CustomEvent(SHELF_OPEN_ADD, { detail: { kind } })
  );
}

function GlobalHotkeyBindings() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { openSearch, toggleHelp } = useHotkeysController();
  const signedIn = Boolean(user);

  const go = useCallback(
    (href: string) => {
      if (typeof window !== "undefined" && window.location.pathname === href) {
        return;
      }
      router.push(href);
    },
    [router]
  );

  const create = useCallback(
    (kind: AddModalKind) => {
      if (pathname.startsWith("/my-content")) {
        openAdd(kind);
        return;
      }
      router.push(`/my-content?add=${kind}`);
    },
    [pathname, router]
  );

  useHotkey("mod+k", () => openSearch(), {
    allowInInput: true,
    enabled: signedIn,
  });
  useHotkey("/", () => openSearch(), { enabled: signedIn });
  useHotkey("?", () => toggleHelp(), {
    allowInModal: true,
    enabled: signedIn,
  });
  useHotkey("g l", () => go(getLibraryHref()), { enabled: signedIn });
  useHotkey("g d", () => go("/dashboard"), { enabled: signedIn });
  useHotkey("g c", () => go("/planner"), { enabled: signedIn });
  useHotkey("g a", () => go("/study-ai"), { enabled: signedIn });
  useHotkey("g q", () => go("/quiz"), { enabled: signedIn });
  useHotkey("g s", () => go("/settings"), { enabled: signedIn });
  useHotkey("g p", () => go("/profile"), { enabled: signedIn });
  useHotkey("c n", () => create("notebook"), { enabled: signedIn });
  useHotkey("c p", () => create("page"), { enabled: signedIn });
  useHotkey("c t", () => create("topic"), { enabled: signedIn });

  return null;
}

export function AppHotkeys() {
  const { user } = useAuth();
  const {
    searchOpen,
    closeSearch,
    helpOpen,
    closeHelp,
  } = useHotkeysController();

  return (
    <>
      <GlobalHotkeyBindings />
      {user && <SearchModal open={searchOpen} onClose={closeSearch} />}
      {user && <HotkeysHelpModal open={helpOpen} onClose={closeHelp} />}
    </>
  );
}
