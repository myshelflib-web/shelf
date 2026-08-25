"use client";

import type { RefObject } from "react";
import {
  BLANK_MIN_H,
  BLANK_MIN_W,
  blankCanvasScrollTarget,
  serializeBlankCanvas,
  type BlankPt,
  type BlankStroke,
  type BlankTextBox,
} from "@/lib/blankCanvas";

/** Seed text-box HTML and scroll position once on first mount. */
export function seedBlankCanvasView(opts: {
  viewport: HTMLElement | null;
  boxes: BlankTextBox[];
  paths: BlankStroke[];
  size: { w: number; h: number };
  bg: string;
  boxEls: Map<string, HTMLDivElement>;
  seededBoxes: Set<string>;
  onViewStateChange?: (state: {
    scrollTop: number;
    scrollLeft: number;
  }) => void;
}) {
  const vp = opts.viewport;
  if (!vp) return;
  requestAnimationFrame(() => {
    opts.boxes.forEach((b) => {
      const el = opts.boxEls.get(b.id);
      if (!el || opts.seededBoxes.has(b.id)) return;
      el.innerHTML = b.html || "<p><br></p>";
      opts.seededBoxes.add(b.id);
    });
    const pan = blankCanvasScrollTarget(
      serializeBlankCanvas(
        opts.size.w,
        opts.size.h,
        opts.boxes,
        opts.paths,
        opts.bg
      ),
      vp.clientWidth,
      vp.clientHeight
    );
    if (pan) {
      vp.scrollLeft = pan.left;
      vp.scrollTop = pan.top;
    } else {
      vp.scrollLeft = Math.max(0, (BLANK_MIN_W - vp.clientWidth) / 2);
      vp.scrollTop = Math.max(0, (BLANK_MIN_H - vp.clientHeight) / 2);
    }
    opts.onViewStateChange?.({
      scrollTop: vp.scrollTop,
      scrollLeft: vp.scrollLeft,
    });
  });
}

export function applyBlankInlineStyle(
  style: Partial<CSSStyleDeclaration>
): boolean {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return false;
  const range = sel.getRangeAt(0);
  const span = document.createElement("span");
  Object.assign(span.style, style);
  try {
    range.surroundContents(span);
  } catch {
    const frag = range.extractContents();
    span.appendChild(frag);
    range.insertNode(span);
  }
  sel.removeAllRanges();
  const next = document.createRange();
  next.selectNodeContents(span);
  sel.addRange(next);
  return true;
}

export function runBlankEditorCommand(
  cmd: string,
  value: string | undefined,
  activeEl: HTMLElement | null,
  emit: () => void
) {
  activeEl?.focus();
  try {
    if (cmd === "fontSizePx" && value) {
      applyBlankInlineStyle({ fontSize: value });
    } else if (cmd === "fontName" && value) {
      applyBlankInlineStyle({ fontFamily: value });
    } else if (cmd === "hiliteColor") {
      try {
        document.execCommand("hiliteColor", false, value);
      } catch {
        document.execCommand("backColor", false, value);
      }
    } else {
      document.execCommand(cmd, false, value);
    }
  } catch {
    /* ignore */
  }
  emit();
}

export function localPointIn(
  el: RefObject<HTMLElement | null>,
  clientX: number,
  clientY: number
): BlankPt {
  const node = el.current;
  if (!node) return { x: 0, y: 0 };
  const r = node.getBoundingClientRect();
  return { x: clientX - r.left, y: clientY - r.top };
}
