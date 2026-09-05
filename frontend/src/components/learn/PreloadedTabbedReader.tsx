"use client";

import { useEffect, useState } from "react";
import { DocumentPane } from "@/components/my-content/reader/DocumentPane";
import { ReaderTabStrip } from "@/components/my-content/reader/ReaderTabStrip";
import { usePreloadedOpenFiles } from "@/components/learn/PreloadedOpenFilesContext";
import { useOptionalPreloadedBrowse } from "@/components/learn/PreloadedBrowseContext";
import { useOpenBrowseHref } from "@/components/learn/BrowseFolderLink";
import { browsePathFromHref } from "@/lib/preloadedBrowse";

const PANE_ID = "preloaded-browse";
const WARM_TABS = 12;

export function PreloadedTabbedReader() {
  const { tabs, activeTab, activateTab, closeTab, openFromHref, updateTabMeta } =
    usePreloadedOpenFiles();
  const browse = useOptionalPreloadedBrowse();
  const openBrowseHref = useOpenBrowseHref();
  const [warmKeys, setWarmKeys] = useState<string[]>([]);

  const activeKey = activeTab?.key ?? null;

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
                onMeta={(patch) => updateTabMeta(tab.key, patch)}
                onNotebookPatch={() => {}}
                onSnapshot={() => {}}
                onHandlers={() => {}}
                onAskStudyAI={() => {}}
                onClipImage={() => {}}
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
      </div>
    </div>
  );
}
