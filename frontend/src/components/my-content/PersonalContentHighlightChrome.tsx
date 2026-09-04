"use client";

import type { MutableRefObject } from "react";
import type { UserContentHighlight } from "@/types";
import {
  createHighlight,
  updateHighlight,
} from "@/lib/offline/highlights";
import type { AnnotationGate } from "@/lib/preloadedReadOnly";
import { HighlightToolbar } from "../HighlightToolbar";
import { HighlightNoteModal } from "../HighlightNoteModal";
import type { HtmlTextPick } from "./htmlPageSelection";

type SelectionState = HtmlTextPick;

type NoteTarget = {
  quote: string;
  highlight?: UserContentHighlight;
  startOffset?: number;
  endOffset?: number;
};

type Props = {
  userTopicId: string;
  highlights: UserContentHighlight[];
  onHighlightsChange: (highlights: UserContentHighlight[]) => void;
  selection: SelectionState | null;
  setSelection: (v: SelectionState | null) => void;
  selectionRef: MutableRefObject<HtmlTextPick | null>;
  activeHighlight: { highlight: UserContentHighlight; rect: DOMRect } | null;
  setActiveHighlight: (
    v: { highlight: UserContentHighlight; rect: DOMRect } | null
  ) => void;
  noteTarget: NoteTarget | null;
  setNoteTarget: (v: NoteTarget | null) => void;
  saveHighlight: (color: string, note?: string) => UserContentHighlight | void;
  removeHighlightNow: (id: string) => void;
  guestLocked?: boolean;
  annotationGate?: AnnotationGate | null;
  onGuestLockedClick?: (feature: string) => void;
  preferredHighlightColorId?: string;
  onAskSelection?: (
    text: string,
    imageBase64?: string,
    attachNote?: (note: string) => Promise<void>
  ) => void;
};

/** Selection / active-highlight toolbars + note modal for HTML content. */
export function PersonalContentHighlightChrome({
  userTopicId,
  highlights,
  onHighlightsChange,
  selection,
  setSelection,
  selectionRef,
  activeHighlight,
  setActiveHighlight,
  noteTarget,
  setNoteTarget,
  saveHighlight,
  removeHighlightNow,
  guestLocked = false,
  annotationGate = null,
  onGuestLockedClick,
  preferredHighlightColorId = "yellow",
  onAskSelection,
}: Props) {
  return (
    <>
      {selection && (
        <HighlightToolbar
          rect={selection.rect}
          locked={guestLocked}
          lockedGate={annotationGate}
          onLockedClick={onGuestLockedClick}
          onHighlight={(color) => void saveHighlight(color)}
          onNote={() => {
            setNoteTarget({
              quote: selection.text,
              startOffset: selection.startOffset,
              endOffset: selection.endOffset,
            });
            setSelection(null);
          }}
          onAsk={
            onAskSelection
              ? () => {
                  const draft = { ...selection };
                  selectionRef.current = draft;
                  onAskSelection(draft.text, undefined, async (note) => {
                    await saveHighlight(preferredHighlightColorId, note);
                  });
                  setSelection(null);
                }
              : undefined
          }
          onClose={() => setSelection(null)}
        />
      )}
      {activeHighlight && (
        <HighlightToolbar
          rect={activeHighlight.rect}
          showColors
          locked={guestLocked}
          lockedGate={annotationGate}
          onLockedClick={onGuestLockedClick}
          onHighlight={() => {
            removeHighlightNow(activeHighlight.highlight.id);
          }}
          onNote={() => {
            setNoteTarget({
              quote: activeHighlight.highlight.text,
              highlight: activeHighlight.highlight,
            });
            setActiveHighlight(null);
          }}
          onAsk={
            onAskSelection
              ? () => {
                  onAskSelection(activeHighlight.highlight.text);
                  setActiveHighlight(null);
                }
              : undefined
          }
          onRemove={() => {
            removeHighlightNow(activeHighlight.highlight.id);
          }}
          onClose={() => setActiveHighlight(null)}
        />
      )}
      {noteTarget && (
        <HighlightNoteModal
          quote={noteTarget.quote}
          initialNote={noteTarget.highlight?.note ?? ""}
          onClose={() => setNoteTarget(null)}
          onSave={async (note) => {
            if (noteTarget.highlight) {
              const highlight = await updateHighlight(
                noteTarget.highlight.id,
                { note },
                userTopicId
              );
              onHighlightsChange(
                highlights.map((h) =>
                  h.id === highlight.id ? { ...h, ...highlight } : h
                )
              );
              return;
            }
            if (
              noteTarget.startOffset == null ||
              noteTarget.endOffset == null
            ) {
              return;
            }
            const highlight = await createHighlight({
              userTopicId,
              text: noteTarget.quote,
              startOffset: noteTarget.startOffset,
              endOffset: noteTarget.endOffset,
              color: "yellow",
              note,
            });
            onHighlightsChange([...highlights, highlight]);
          }}
          onDeleteNote={
            noteTarget.highlight?.note
              ? async () => {
                  const highlight = await updateHighlight(
                    noteTarget.highlight!.id,
                    { note: null },
                    userTopicId
                  );
                  onHighlightsChange(
                    highlights.map((h) =>
                      h.id === highlight.id ? { ...h, note: null } : h
                    )
                  );
                }
              : undefined
          }
          onRemoveHighlight={
            noteTarget.highlight
              ? () => {
                  removeHighlightNow(noteTarget.highlight!.id);
                }
              : undefined
          }
        />
      )}
    </>
  );
}
