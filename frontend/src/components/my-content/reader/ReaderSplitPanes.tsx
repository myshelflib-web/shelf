"use client";

import {
  Group,
  Panel,
  Separator,
} from "react-resizable-panels";
import { UserSubject } from "@/types";
import {
  DocumentPane,
  DocumentPaneHandlers,
  DocumentPaneSnapshot,
  LoadedPage,
} from "./DocumentPane";
import { ReaderTabStrip } from "./ReaderTabStrip";
import type { OpenTab, ReaderPane } from "./types";

type Props = {
  panes: ReaderPane[];
  focusedPaneId: string;
  warmKeys: Record<string, string[]>;
  notebook: UserSubject | null;
  studyAIOpen: boolean;
  onFocusPane: (paneId: string) => void;
  onActivateTab: (paneId: string, key: string) => void;
  onCloseTab: (paneId: string, key: string) => void;
  onOpenTab: (paneId: string, tab: OpenTab) => void;
  onReorderTabs: (
    paneId: string,
    fromKey: string,
    toKey: string,
    place: "before" | "after"
  ) => void;
  onUpdateTabMeta: (
    paneId: string,
    key: string,
    patch: Partial<Pick<OpenTab, "title" | "pageId">>
  ) => void;
  onNotebookPatch: (
    updater: (prev: UserSubject | null) => UserSubject | null
  ) => void;
  onSnapshot: (paneId: string, snap: DocumentPaneSnapshot, isActive: boolean) => void;
  onHandlers: (paneId: string, h: DocumentPaneHandlers, isActive: boolean) => void;
  onAskStudyAI: (
    pageId: string,
    selection?: string,
    imageBase64?: string,
    onAttachNote?: (note: string) => Promise<void>,
    embedMode?: boolean
  ) => void;
  onCloseStudyAI: () => void;
  onClipImage: (data: string, page: LoadedPage) => void;
  onNavigate: (href: string) => void;
  onReadPercent: (pageId: string, percent: number) => void;
};

function PaneBody({
  pane,
  showTabStrip,
  focused,
  warmKeys,
  notebook,
  studyAIOpen,
  onFocusPane,
  onActivateTab,
  onCloseTab,
  onOpenTab,
  onReorderTabs,
  onUpdateTabMeta,
  onNotebookPatch,
  onSnapshot,
  onHandlers,
  onAskStudyAI,
  onCloseStudyAI,
  onClipImage,
  onNavigate,
  onReadPercent,
}: {
  pane: ReaderPane;
  showTabStrip: boolean;
  focused: boolean;
  warmKeys: string[];
  notebook: UserSubject | null;
  studyAIOpen: boolean;
  onFocusPane: (paneId: string) => void;
  onActivateTab: (paneId: string, key: string) => void;
  onCloseTab: (paneId: string, key: string) => void;
  onOpenTab: (paneId: string, tab: OpenTab) => void;
  onReorderTabs: (
    paneId: string,
    fromKey: string,
    toKey: string,
    place: "before" | "after"
  ) => void;
  onUpdateTabMeta: (
    paneId: string,
    key: string,
    patch: Partial<Pick<OpenTab, "title" | "pageId">>
  ) => void;
  onNotebookPatch: (
    updater: (prev: UserSubject | null) => UserSubject | null
  ) => void;
  onSnapshot: (snap: DocumentPaneSnapshot, isActive: boolean) => void;
  onHandlers: (h: DocumentPaneHandlers, isActive: boolean) => void;
  onAskStudyAI: Props["onAskStudyAI"];
  onCloseStudyAI: () => void;
  onClipImage: (data: string, page: LoadedPage) => void;
  onNavigate: (href: string) => void;
  onReadPercent: (pageId: string, percent: number) => void;
}) {
  const active =
    pane.tabs.find((t) => t.key === pane.activeTabKey) ?? pane.tabs[0];
  if (!active) return null;

  return (
    <div
      className="flex flex-col flex-1 w-full h-full min-w-0 min-h-0 overflow-hidden"
      onMouseDown={() => onFocusPane(pane.id)}
    >
      {showTabStrip ? (
        <ReaderTabStrip
          paneId={pane.id}
          tabs={pane.tabs}
          activeTabKey={pane.activeTabKey}
          focused={focused}
          onActivate={(key) => onActivateTab(pane.id, key)}
          onClose={(key) => onCloseTab(pane.id, key)}
          onFocusPane={() => onFocusPane(pane.id)}
          onDropPage={(tab) => onOpenTab(pane.id, tab)}
          onReorderTabs={(fromKey, toKey, place) =>
            onReorderTabs(pane.id, fromKey, toKey, place)
          }
        />
      ) : null}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
        {pane.tabs.map((tab) => {
          const isActive = tab.key === active.key;
          const warm = warmKeys.includes(tab.key);
          if (!isActive && !warm) return null;
          return (
            <div
              key={tab.key}
              className={
                isActive
                  ? "flex-1 flex flex-col min-h-0 overflow-hidden"
                  : "hidden"
              }
              aria-hidden={!isActive}
            >
              <DocumentPane
                tab={tab}
                paneId={pane.id}
                focused={focused && isActive}
                notebook={notebook}
                onMeta={(patch) => onUpdateTabMeta(pane.id, tab.key, patch)}
                onNotebookPatch={onNotebookPatch}
                onSnapshot={(snap) => onSnapshot(snap, isActive)}
                onHandlers={(h) => onHandlers(h, isActive)}
                onAskStudyAI={onAskStudyAI}
                workspaceStudyAIOpen={studyAIOpen}
                onCloseStudyAI={onCloseStudyAI}
                onClipImage={onClipImage}
                onNavigate={onNavigate}
                onPageDeleted={() => onCloseTab(pane.id, tab.key)}
                onDropPage={(t) => onOpenTab(pane.id, t)}
                onReadPercent={onReadPercent}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function paneProps(
  props: Props,
  pane: ReaderPane,
  showTabStrip: boolean
) {
  return {
    pane,
    showTabStrip,
    focused: pane.id === props.focusedPaneId,
    warmKeys: props.warmKeys[pane.id] ?? [],
    notebook: props.notebook,
    studyAIOpen: props.studyAIOpen,
    onFocusPane: props.onFocusPane,
    onActivateTab: props.onActivateTab,
    onCloseTab: props.onCloseTab,
    onOpenTab: props.onOpenTab,
    onReorderTabs: props.onReorderTabs,
    onUpdateTabMeta: props.onUpdateTabMeta,
    onNotebookPatch: props.onNotebookPatch,
    onSnapshot: (snap: DocumentPaneSnapshot, isActive: boolean) =>
      props.onSnapshot(pane.id, snap, isActive),
    onHandlers: (h: DocumentPaneHandlers, isActive: boolean) =>
      props.onHandlers(pane.id, h, isActive),
    onAskStudyAI: props.onAskStudyAI,
    onCloseStudyAI: props.onCloseStudyAI,
    onClipImage: props.onClipImage,
    onNavigate: props.onNavigate,
    onReadPercent: props.onReadPercent,
  };
}

/** One or two reader panes; split mode is drag-resizable. */
export function ReaderSplitPanes(props: Props) {
  const { panes } = props;
  const split = panes.length > 1;
  const first = panes[0];
  const second = panes[1];

  if (!split || !first) {
    if (!first) return null;
    return (
      <div className="flex-1 flex min-h-0 overflow-hidden min-w-0">
        <PaneBody {...paneProps(props, first, false)} />
      </div>
    );
  }

  return (
    <Group
      orientation="horizontal"
      className="flex-1 flex min-h-0 overflow-hidden min-w-0"
      id="reader-split-panes"
    >
      <Panel id={`split-${first.id}`} defaultSize="50%" minSize="18%" className="min-w-0 flex flex-col">
        <PaneBody {...paneProps(props, first, true)} />
      </Panel>
      <Separator className="w-1.5 bg-[var(--border)] data-[separator]:hover:bg-[var(--accent)]/40 data-[separator]:active:bg-[var(--accent)]/50 cursor-col-resize" />
      {second ? (
        <Panel
          id={`split-${second.id}`}
          defaultSize="50%"
          minSize="18%"
          className="min-w-0 flex flex-col"
        >
          <PaneBody {...paneProps(props, second, true)} />
        </Panel>
      ) : null}
    </Group>
  );
}
