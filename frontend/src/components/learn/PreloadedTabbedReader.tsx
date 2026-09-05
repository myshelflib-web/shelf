"use client";

import { useCallback, useEffect, useState } from "react";
import { DocumentPane } from "@/components/my-content/reader/DocumentPane";
import { ReaderTabStrip } from "@/components/my-content/reader/ReaderTabStrip";
import { ReaderBottomBar } from "@/components/ReaderBottomBar";
import { SignInPromptModal } from "@/components/learn/SignInPromptModal";
import { usePreloadedOpenFiles } from "@/components/learn/PreloadedOpenFilesContext";
import { useOptionalPreloadedBrowse } from "@/components/learn/PreloadedBrowseContext";
import { useOpenBrowseHref } from "@/components/learn/BrowseFolderLink";
import { useAuth } from "@/hooks/useAuth";
import { browsePathFromHref } from "@/lib/preloadedBrowse";

const PANE_ID = "preloaded-browse";
const WARM_TABS = 12;

export function PreloadedTabbedReader() {
  const {
    tabs,
    activeTab,
    activateTab,
    closeTab,
    openFromHref,
    reorderTabs,
    updateTabMeta,
  } = usePreloadedOpenFiles();
  const browse = useOptionalPreloadedBrowse();
  const openBrowseHref = useOpenBrowseHref();
  const { user, loading: authLoading } = useAuth();
  const [warmKeys, setWarmKeys] = useState<string[]>([]);
  const [signInFeature, setSignInFeature] = useState<string | null>(null);

  const activeKey = activeTab?.key ?? null;
  const returnTo = activeTab?.href ?? "/learn";
  const guestLocked = !user && !authLoading;
  const promptSignIn = useCallback((feature = "Use Study AI") => {
    setSignInFeature(feature);
  }, []);
  const signInGate = guestLocked
    ? { active: true as const, prompt: promptSignIn }
    : undefined;

  useEffect(() => {
    setWarmKeys((prev) => {
      const next = [
        ...(activeKey ? [activeKey] : []),
        ...prev.filter((k) => k !== activeKey && tabs.some((t) => t.key === k)),
      ].slice(0, WARM_TABS);
      if (next.length === prev.length && next.every((k, i) => k === prev[i])) {
        return prev;
      }
      return next;
    });
  }, [activeKey, tabs]);

  if (!tabs.length || !activeTab) return null;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <ReaderTabStrip
        paneId={PANE_ID}
        tabs={tabs}
        activeTabKey={activeKey}
        focused
        onActivate={activateTab}
        onClose={closeTab}
        onFocusPane={() => {}}
        onDropPage={(tab) => openFromHref(tab.href, tab.title, tab.pageId)}
        onReorderTabs={reorderTabs}
      />
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
        {tabs.map((tab) => {
          const isActive = tab.key === activeKey;
          if (!isActive && !warmKeys.includes(tab.key)) return null;
          return (
            <div
              key={tab.key}
              className={
                isActive
                  ? "flex min-h-0 flex-1 flex-col overflow-hidden"
                  : "hidden"
              }
              aria-hidden={!isActive}
            >
              <DocumentPane
                tab={tab}
                paneId={PANE_ID}
                focused={isActive}
                notebook={null}
                signInGate={signInGate}
                onMeta={(patch) => updateTabMeta(tab.key, patch)}
                onNotebookPatch={() => {}}
                onSnapshot={() => {}}
                onHandlers={() => {}}
                onAskStudyAI={() => {
                  if (guestLocked) promptSignIn("Use Study AI");
                }}
                onClipImage={() => {
                  if (guestLocked) promptSignIn("Save clips");
                }}
                onNavigate={(href) => {
                  const next = browsePathFromHref(href);
                  if (next.articleSlug) {
                    openFromHref(href);
                    return;
                  }
                  browse?.setPath({
                    areaId: browse.path.areaId,
                    subjectSlug: next.subjectSlug ?? browse.path.subjectSlug,
                    topicSlug: next.topicSlug ?? browse.path.topicSlug,
                  });
                  openBrowseHref(href);
                }}
                onDropPage={(dropped) =>
                  openFromHref(dropped.href, dropped.title, dropped.pageId)
                }
                onReadPercent={() => {}}
              />
            </div>
          );
        })}
        {guestLocked ? (
          <ReaderBottomBar
            completed={false}
            onToggleComplete={() => promptSignIn("Mark as complete")}
            onOpenStudyAI={() => promptSignIn("Use Study AI")}
            showStudyAI
            guestLocked
            onGuestLockedClick={promptSignIn}
            returnTo={returnTo}
          />
        ) : null}
      </div>
      {signInFeature ? (
        <SignInPromptModal
          feature={signInFeature}
          returnTo={returnTo}
          onClose={() => setSignInFeature(null)}
        />
      ) : null}
    </div>
  );
}
