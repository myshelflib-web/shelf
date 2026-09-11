"use client";

import type { MutableRefObject } from "react";
import type { UserContentHighlight } from "@/types";
import { updateHighlight } from "@/lib/offline/highlights";
import type { AnnotationGate } from "@/lib/preloadedReadOnly";
import { HighlightToolbar } from "../HighlightToolbar";
import { HighlightNoteModal } from "../HighlightNoteModal";
import type { HtmlTextPick } from "./htmlPageSelection";

type SelectionState = HtmlTextPick;

type NoteTarget = {
  quote: string;
  highlight?: UserContentHighlight;
  pick?: HtmlTextPick;
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
  saveHighlight: (
    color: string,
    note?: string,
    from?: HtmlTextPick
  ) => UserContentHighlight | void;
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

/** Selection / active-highlight toolbars + note modal for HTML content.
 *  Paraphrase / Originality / Cite live only on Docs (DocToolbar). */
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
            const draft = selectionRef.current ?? selection;
            setNoteTarget({
              quote: draft.text,
              pick: draft,
            });
            // Close toolbar; keep selectionRef armed until note save/cancel.
            setSelection(null);
          }}
          onAsk={
            onAskSelection
              ? () => {
                  const draft = { ...(selectionRef.current ?? selection) };
                  selectionRef.current = draft;
                  onAskSelection(draft.text, undefined, async (note) => {
                    void saveHighlight(preferredHighlightColorId, note, draft);
                  });
                  setSelection(null);
                  window.getSelection()?.removeAllRanges();
                }
              : undefined
          }
          onClose={() => {
            selectionRef.current = null;
            setSelection(null);
          }}
        />
      )}
      {activeHighlight && (
        <HighlightToolbar
          rect={activeHighlight.rect}
          showColors
          locked={guestLocked}
          lockedGate={annotationGate}
          onLockedClick={onGuestLockedClick}
          onHighlight={(color) => {
            const h = activeHighlight.highlight;
            const updated = { ...h, color };
            onHighlightsChange(
              highlights.map((item) => (item.id === h.id ? updated : item))
            );
            setActiveHighlight(null);
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
                  const text = activeHighlight.highlight.text;
                  onAskSelection(text, undefined, async (note) => {
                    const h = activeHighlight.highlight;
                    const updated = await updateHighlight(
                      h.id,
                      { note },
                      userTopicId
                    );
                    onHighlightsChange(
                      highlights.map((item) =>
                        item.id === updated.id ? { ...item, ...updated } : item
                      )
                    );
                  });
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
          onClose={() => {
            selectionRef.current = null;
            setNoteTarget(null);
          }}
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
            const pick = noteTarget.pick ?? selectionRef.current;
            if (!pick) return;
            void saveHighlight(preferredHighlightColorId, note, pick);
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
