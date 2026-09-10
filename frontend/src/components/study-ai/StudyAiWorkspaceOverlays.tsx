"use client";

import type { RefObject, ReactNode } from "react";
import { SaveAnswerModal } from "@/components/study-ai/SaveAnswerModal";
import { FlashcardsStudyModal } from "@/components/study-ai/FlashcardsStudyModal";
import { StudySourcesModal } from "@/components/study-ai/StudySourcesModal";
import { parseFlashcards } from "@/lib/parseFlashcards";
import {
  StudyAiAttachMenu,
  StudyAiRenameModal,
} from "@/components/study-ai/StudyAiChatMenus";
import { ShelfDrawer } from "@/components/ShelfDrawer";
import type { ChatThreadSummary } from "@/types";
import type { PopoverKind } from "@/lib/studyAiWorkspaceUtils";

type ChatApi = {
  activeId?: string;
  title: string;
  threadMeta: ChatThreadSummary | null;
  setThreadMeta: (t: ChatThreadSummary) => void;
  setTitle: (t: string) => void;
  setActiveId: (id: string) => void;
  refreshThreads: () => void;
};

export function StudyAiWorkspaceOverlays({
  chat,
  popover,
  closePopover,
  attachMenuRef,
  renameOpen,
  renameValue,
  setRenameValue,
  setRenameOpen,
  confirmRename,
  sourcesOpen,
  setSourcesOpen,
  flashcardsMd,
  setFlashcardsMd,
  saveContent,
  setSaveContent,
  fileRef,
  compactPortrait,
  threadsOpen,
  setThreadsOpen,
  isPhone,
  sidebar,
}: {
  chat: ChatApi;
  popover: PopoverKind;
  closePopover: () => void;
  attachMenuRef: RefObject<HTMLDivElement | null>;
  renameOpen: boolean;
  renameValue: string;
  setRenameValue: (v: string) => void;
  setRenameOpen: (v: boolean) => void;
  confirmRename: () => void;
  sourcesOpen: boolean;
  setSourcesOpen: (v: boolean) => void;
  flashcardsMd: string | null;
  setFlashcardsMd: (v: string | null) => void;
  saveContent: string | null;
  setSaveContent: (v: string | null) => void;
  fileRef: RefObject<HTMLInputElement | null>;
  compactPortrait: boolean;
  threadsOpen: boolean;
  setThreadsOpen: (v: boolean) => void;
  isPhone: boolean;
  sidebar: ReactNode;
}) {
  return (
    <>
      <StudyAiAttachMenu
        menuRef={attachMenuRef}
        open={popover === "attach"}
        onClose={closePopover}
        onFromLibrary={() => setSourcesOpen(true)}
        onUpload={() => fileRef.current?.click()}
      />

      {renameOpen && (
        <StudyAiRenameModal
          value={renameValue}
          onChange={setRenameValue}
          onClose={() => setRenameOpen(false)}
          onSave={confirmRename}
        />
      )}

      {sourcesOpen && (
        <StudySourcesModal
          threadId={chat.activeId}
          thread={chat.threadMeta}
          onThreadUpdated={(t) => {
            chat.setThreadMeta(t);
            chat.setTitle(t.title);
            chat.setActiveId(t.id);
            chat.refreshThreads();
          }}
          onClose={() => setSourcesOpen(false)}
        />
      )}

      {flashcardsMd && (
        <FlashcardsStudyModal
          cards={parseFlashcards(flashcardsMd)}
          title="Flashcards"
          onClose={() => setFlashcardsMd(null)}
          onSave={(md) => {
            setFlashcardsMd(null);
            setSaveContent(md);
          }}
        />
      )}

      {saveContent && (
        <SaveAnswerModal
          content={saveContent}
          defaultTitle={chat.title === "New chat" ? "Study AI notes" : chat.title}
          onClose={() => setSaveContent(null)}
        />
      )}

      <ShelfDrawer
        open={compactPortrait && threadsOpen}
        onClose={() => setThreadsOpen(false)}
        title="Chats"
        fullScreen={isPhone}
      >
        <div className="study-ai-sidebar-drawer-host h-full">{sidebar}</div>
      </ShelfDrawer>
    </>
  );
}
