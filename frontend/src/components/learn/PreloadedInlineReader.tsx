"use client";

import { useMemo, useState } from "react";
import { DocumentPane } from "@/components/my-content/reader/DocumentPane";
import { tabFromScope } from "@/components/my-content/reader/types";
import { useOptionalPreloadedBrowse } from "@/components/learn/PreloadedBrowseContext";
import { useOpenBrowseHref } from "@/components/learn/BrowseFolderLink";
import { learnScope } from "@/lib/learnContent";
import { browsePathFromHref } from "@/lib/preloadedBrowse";

const INLINE_PANE_ID = "preloaded-inline";

export function PreloadedInlineReader({
  subjectSlug,
  topicSlug,
  articleSlug,
}: {
  subjectSlug: string;
  topicSlug: string;
  articleSlug: string;
}) {
  const browse = useOptionalPreloadedBrowse();
  const openBrowseHref = useOpenBrowseHref();
  const [title, setTitle] = useState(articleSlug);

  const tab = useMemo(
    () =>
      tabFromScope(
        learnScope(subjectSlug, topicSlug, articleSlug),
        title
      ),
    [subjectSlug, topicSlug, articleSlug, title]
  );

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <DocumentPane
        tab={tab}
        paneId={INLINE_PANE_ID}
        focused
        notebook={null}
        onMeta={(patch) => {
          if (patch.title) setTitle(patch.title);
        }}
        onNotebookPatch={() => {}}
        onSnapshot={() => {}}
        onHandlers={() => {}}
        onAskStudyAI={() => {}}
        onClipImage={() => {}}
        onNavigate={(href) => {
          const next = browsePathFromHref(href);
          if (next.articleSlug) {
            openBrowseHref(href);
            return;
          }
          browse?.setPath({
            areaId: browse.path.areaId,
            subjectSlug,
            topicSlug,
          });
        }}
        onDropPage={() => {}}
        onReadPercent={() => {}}
      />
    </div>
  );
}
