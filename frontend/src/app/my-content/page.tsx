"use client";

import { useEffect, Suspense, useState, useLayoutEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Header } from "@/components/Header";
import { LibrarySidePanel } from "@/components/my-content/LibrarySidePanel";
import { LibraryCenterPane } from "@/components/my-content/LibraryCenterPane";
import { PreloadedBrowseShell } from "@/components/learn/PreloadedOpenFilesContext";
import { useAddContent } from "@/components/my-content/MyContentAddProvider";
import { useAuth } from "@/hooks/useAuth";
import { useCompactPortrait } from "@/hooks/useCompactPortrait";
import { useIsPhone } from "@/hooks/useIsPhone";
import { ShelfDrawer } from "@/components/ShelfDrawer";
import { ShelfExplorerFab } from "@/components/ShelfExplorerFab";
import { ShelfLoading } from "@/components/ShelfLoading";
import { api } from "@/lib/api";
import { consumeGuestLearnImport } from "@/lib/consumeGuestLearnImport";
import { SHELF_OPEN_LIBRARY_EXPLORER } from "@/lib/contentEvents";
import { getFocusedWorkspaceHref } from "@/components/my-content/reader/types";
import { isLearnReaderHref } from "@/lib/learnContent";

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

  // Tablet compact: FAB / event opens drawer. Phone uses explorer as the main screen.
  useEffect(() => {
    if (!compactPortrait || isPhone) return;
    const onOpen = () => setExplorerOpen(true);
    window.addEventListener(SHELF_OPEN_LIBRARY_EXPLORER, onOpen);
    return () => window.removeEventListener(SHELF_OPEN_LIBRARY_EXPLORER, onOpen);
  }, [compactPortrait, isPhone]);

  // Resume open reader tabs (desktop/tablet). Phone Library stays on the list —
  // open a file for single-doc reading instead of jumping into a mid-pane empty state.
  useLayoutEffect(() => {
    if (authLoading || !user) return;
    if (isPhone) {
      setRestoringTabs(false);
      return;
    }
    if (searchParams.get("add")) {
      setRestoringTabs(false);
      return;
    }
    let cancelled = false;
    void consumeGuestLearnImport().then((href) => {
      if (cancelled) return;
      if (href && !isLearnReaderHref(href)) {
        router.replace(href);
        return;
      }
      const tabHref = getFocusedWorkspaceHref();
      if (tabHref && !isLearnReaderHref(tabHref)) {
        router.replace(tabHref);
        return;
      }
      setRestoringTabs(false);
    });
    return () => {
      cancelled = true;
    };
  }, [authLoading, user, router, searchParams, isPhone]);

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
        <ShelfLoading label="Opening your library" />
      </div>
    );
  }

  return (
    <PreloadedBrowseShell>
      <div className="h-full flex flex-col overflow-hidden">
        <Header />
        {isPhone ? (
          <main className="flex-1 min-h-0 overflow-hidden bg-[var(--bg-primary)]">
            <LibrarySidePanel className="w-full border-r-0 h-full" />
          </main>
        ) : (
          <>
            <div className="flex flex-1 overflow-hidden min-h-0">
              {!compactPortrait ? <LibrarySidePanel /> : null}
              <main className="flex-1 min-h-0 overflow-hidden bg-[var(--bg-primary)] relative">
                {compactPortrait && !explorerOpen ? (
                  <ShelfExplorerFab onClick={() => setExplorerOpen(true)} />
                ) : null}
                <LibraryCenterPane />
              </main>
            </div>
            <ShelfDrawer
              open={compactPortrait && explorerOpen}
              onClose={() => setExplorerOpen(false)}
              title="Explorer"
            >
              <LibrarySidePanel className="w-full border-r-0" />
            </ShelfDrawer>
          </>
        )}
      </div>
    </PreloadedBrowseShell>
  );
}

export default function MyContentPage() {
  return (
    <Suspense
      fallback={
        <div className="h-full flex items-center justify-center">
          <ShelfLoading />
        </div>
      }
    >
      <MyContentDashboard />
    </Suspense>
  );
}
