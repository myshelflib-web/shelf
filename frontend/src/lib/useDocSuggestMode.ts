"use client";

import { useCallback, useEffect } from "react";

type Args = {
  enabled: boolean;
  bodyRef: React.RefObject<HTMLElement | null>;
  onEdited: () => void;
};

function wrapRangeAsSuggest(range: Range, op: "ins" | "del") {
  const mark = document.createElement("mark");
  mark.className = "shelf-suggest";
  mark.setAttribute("data-op", op);
  mark.setAttribute("data-author", "me");
  try {
    range.surroundContents(mark);
  } catch {
    const frag = range.extractContents();
    mark.appendChild(frag);
    range.insertNode(mark);
  }
  return mark;
}

/** Track-changes behavior for Doc suggest mode (beforeinput). */
export function useDocSuggestMode({ enabled, bodyRef, onEdited }: Args) {
  const applySuggestToSelection = useCallback(
    (op: "ins" | "del") => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
      const body = bodyRef.current;
      if (!body || !body.contains(sel.anchorNode)) return;
      wrapRangeAsSuggest(sel.getRangeAt(0), op);
      onEdited();
    },
    [bodyRef, onEdited]
  );

  const acceptSuggest = useCallback(() => {
    const el = bodyRef.current;
    if (!el) return;
    el.querySelectorAll("mark.shelf-suggest").forEach((m) => {
      const op = m.getAttribute("data-op");
      if (op === "del") m.remove();
      else {
        const parent = m.parentNode;
        while (m.firstChild) parent?.insertBefore(m.firstChild, m);
        m.remove();
      }
    });
    onEdited();
  }, [bodyRef, onEdited]);

  const rejectSuggest = useCallback(() => {
    const el = bodyRef.current;
    if (!el) return;
    el.querySelectorAll("mark.shelf-suggest").forEach((m) => {
      const op = m.getAttribute("data-op");
      if (op === "ins") m.remove();
      else {
        const parent = m.parentNode;
        while (m.firstChild) parent?.insertBefore(m.firstChild, m);
        m.remove();
      }
    });
    onEdited();
  }, [bodyRef, onEdited]);

  useEffect(() => {
    const el = bodyRef.current;
    if (!enabled || !el) return;

    const onBeforeInput = (ev: Event) => {
      const e = ev as InputEvent;
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      if (!el.contains(sel.anchorNode)) return;

      if (e.inputType === "insertText" && e.data) {
        e.preventDefault();
        const range = sel.getRangeAt(0);
        range.deleteContents();
        const at =
          range.startContainer.nodeType === Node.TEXT_NODE
            ? range.startContainer.parentElement
            : (range.startContainer as Element | null);
        const existing = at?.closest?.(
          'mark.shelf-suggest[data-op="ins"]'
        ) as HTMLElement | null;
        if (existing && el.contains(existing)) {
          const textNode = document.createTextNode(e.data);
          if (
            range.startContainer.nodeType === Node.TEXT_NODE &&
            existing.contains(range.startContainer)
          ) {
            const tn = range.startContainer as Text;
            tn.insertData(range.startOffset, e.data);
            range.setStart(tn, range.startOffset + e.data.length);
          } else {
            existing.appendChild(textNode);
            range.setStartAfter(textNode);
          }
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);
          onEdited();
          return;
        }
        const mark = document.createElement("mark");
        mark.className = "shelf-suggest";
        mark.setAttribute("data-op", "ins");
        mark.setAttribute("data-author", "me");
        mark.textContent = e.data;
        range.insertNode(mark);
        range.setStartAfter(mark);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
        onEdited();
        return;
      }

      if (
        e.inputType === "insertParagraph" ||
        e.inputType === "insertLineBreak"
      ) {
        e.preventDefault();
        document.execCommand(
          "insertHTML",
          false,
          `<mark class="shelf-suggest" data-op="ins" data-author="me"><br></mark>`
        );
        if (e.inputType === "insertParagraph") {
          document.execCommand("insertParagraph");
        }
        onEdited();
        return;
      }

      if (
        e.inputType === "deleteContentBackward" ||
        e.inputType === "deleteContentForward" ||
        e.inputType === "deleteByCut" ||
        e.inputType === "deleteContent"
      ) {
        e.preventDefault();
        if (sel.isCollapsed) {
          if (e.inputType === "deleteContentBackward") {
            sel.modify("extend", "backward", "character");
          } else {
            sel.modify("extend", "forward", "character");
          }
          if (sel.isCollapsed) return;
        }
        const delRange = sel.getRangeAt(0);
        const ancestor =
          delRange.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
            ? (delRange.commonAncestorContainer as Element)
            : delRange.commonAncestorContainer.parentElement;
        const existing = ancestor?.closest?.("mark.shelf-suggest");
        if (existing?.getAttribute("data-op") === "ins") {
          delRange.deleteContents();
          if (!existing.textContent) existing.remove();
          onEdited();
          return;
        }
        wrapRangeAsSuggest(delRange, "del");
        onEdited();
      }
    };

    el.addEventListener("beforeinput", onBeforeInput);
    return () => el.removeEventListener("beforeinput", onBeforeInput);
  }, [bodyRef, enabled, onEdited]);

  return {
    applySuggestToSelection,
    acceptSuggest,
    rejectSuggest,
  };
}
