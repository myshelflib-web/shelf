"use client";

import { useCallback, useMemo, useState } from "react";
import { DocumentPane } from "@/components/my-content/reader/DocumentPane";
import { tabFromScope } from "@/components/my-content/reader/types";
import { useOptionalPreloadedBrowse } from "@/components/learn/PreloadedBrowseContext";
import { useOpenBrowseHref } from "@/components/learn/BrowseFolderLink";
import { useLearnSubjects } from "@/hooks/useLearnSubjects";
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
  const { subjects } = useLearnSubjects();
  const [title, setTitle] = useState(articleSlug);

  const subject = subjects.find((s) => s.slug === subjectSlug);
  const topic = subject?.topics.find((t) => t.slug === topicSlug);
  const tab = useMemo(
    () =>
      tabFromScope(
        learnScope(subjectSlug, topicSlug, articleSlug),
        title
      ),
    [subjectSlug, topicSlug, articleSlug, title]
  );

  const closeArticle = useCallback(() => {
    browse?.setPath({
      areaId: browse.path.areaId,
      subjectSlug,
      topicSlug,
    });
  }, [browse, subjectSlug, topicSlug]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <button
        type="button"
        onClick={closeArticle}
        className="explore-back-library shrink-0"
      >
        ← {topic?.title ?? "Back"}
      </button>
      <div className="min-h-0 flex-1 overflow-hidden">
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
    </div>
  );
}
