"use client";

import { useEffect, Suspense, useState, useLayoutEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { LibrarySidePanel } from "@/components/my-content/LibrarySidePanel";
import { LibraryEmptyWorkspace } from "@/components/my-content/LibraryEmptyWorkspace";
import { useAddContent } from "@/components/my-content/MyContentAddProvider";
import { useAuth } from "@/hooks/useAuth";
import { useCompactPortrait } from "@/hooks/useCompactPortrait";
import { useIsPhone } from "@/hooks/useIsPhone";
import { ShelfDrawer } from "@/components/ShelfDrawer";
import { ShelfExplorerFab } from "@/components/ShelfExplorerFab";
import { ThinkingIndicator } from "@/components/GreetingAccent";
import { api } from "@/lib/api";
import { consumeGuestLearnImport } from "@/lib/consumeGuestLearnImport";
import { getFocusedWorkspaceHref } from "@/components/my-content/reader/types";

function MyContentDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { openAdd } = useAddContent();
  const compactPortrait = useCompactPortrait();
  const isPhone = useIsPhone();
  const [explorerOpen, setExplorerOpen] = useState(false);
  const [restoringTabs, setRestoringTabs] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  // Resume open reader tabs without waiting for paint (avoids blank flash).
  // Prefer linking straight to the tab from Header (`getLibraryHref`) so this
  // is only a fallback for bookmarks / cold loads of `/my-content`.
  useLayoutEffect(() => {
    if (authLoading || !user) return;
    if (searchParams.get("add")) {
      setRestoringTabs(false);
      return;
    }
    let cancelled = false;
    void consumeGuestLearnImport().then((href) => {
      if (cancelled) return;
      if (href) {
        router.replace(href);
        return;
      }
      const tabHref = getFocusedWorkspaceHref();
      if (tabHref) {
        router.replace(tabHref);
        return;
      }
      setRestoringTabs(false);
    });
    return () => {
      cancelled = true;
    };
  }, [authLoading, user, router, searchParams]);

  // Deep-link ?add=… from older URLs
  useEffect(() => {
    const add = searchParams.get("add");
    if (!add || !user) return;
    if (add === "notebook" || add === "section") {
      openAdd({ kind: "notebook" });
      router.replace("/my-content");
      return;
    }
    if (add === "page") {
      openAdd({ kind: "page" });
      router.replace("/my-content");
      return;
    }
    if (add === "topic") {
      const nb = searchParams.get("notebook") ?? searchParams.get("section");
      if (nb) {
        api.myContent
          .getSubject(nb)
          .then(({ subject }) => openAdd({ kind: "topic", notebook: subject }))
          .catch(() => openAdd({ kind: "notebook" }));
      } else {
        openAdd({ kind: "notebook" });
      }
      router.replace("/my-content");
    }
  }, [searchParams, user, openAdd, router]);

  if (authLoading || !user || restoringTabs) {
    return (
      <div className="h-full flex items-center justify-center">
        <ThinkingIndicator label="Loading" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <Header />
      <div className="flex flex-1 overflow-hidden min-h-0">
        {!compactPortrait ? <LibrarySidePanel /> : null}
        <main className="flex-1 min-h-0 overflow-hidden bg-[var(--bg-primary)] relative">
          {compactPortrait && !explorerOpen ? (
            <ShelfExplorerFab onClick={() => setExplorerOpen(true)} />
          ) : null}
          <LibraryEmptyWorkspace />
        </main>
      </div>

      <ShelfDrawer
        open={compactPortrait && explorerOpen}
        onClose={() => setExplorerOpen(false)}
        title="Explorer"
        fullScreen={isPhone}
      >
        <LibrarySidePanel className="w-full border-r-0" />
      </ShelfDrawer>
    </div>
  );
}

export default function MyContentPage() {
  return (
    <Suspense
      fallback={
        <div className="h-full flex items-center justify-center">
          <ThinkingIndicator label="Loading" />
        </div>
      }
    >
      <MyContentDashboard />
    </Suspense>
  );
}
