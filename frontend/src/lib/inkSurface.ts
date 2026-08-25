type EditableLike = {
  isContentEditable?: boolean;
  tagName?: string;
  parentElement?: EditableLike | null;
  closest?: (selector: string) => unknown;
};

/** True for inputs / textareas / contenteditable — caret must not be cleared. */
export function isEditableTarget(
  el: EventTarget | Node | EditableLike | null
): boolean {
  if (!el || typeof el !== "object") return false;
  const node = el as EditableLike;
  if (node.isContentEditable) return true;
  const tag = (node.tagName || "").toUpperCase();
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (typeof node.closest === "function") {
    return Boolean(
      node.closest("input, textarea, select, [contenteditable='true']")
    );
  }
  return isEditableTarget(node.parentElement ?? null);
}

export function shouldClearNativeSelection(opts?: {
  active?: EventTarget | Node | EditableLike | null;
  anchor?: EventTarget | Node | EditableLike | null;
  dialogOpen?: boolean;
}): boolean {
  if (opts?.dialogOpen) return false;
  if (isEditableTarget(opts?.active ?? null)) return false;
  if (isEditableTarget(opts?.anchor ?? null)) return false;
  return true;
}

/** iOS/iPadOS starts a native text selection on stylus drag unless we cancel it. */
export function clearNativeSelection() {
  const sel = window.getSelection();
  if (
    !shouldClearNativeSelection({
      active: document.activeElement,
      anchor: sel?.anchorNode ?? null,
      dialogOpen: Boolean(document.querySelector('[role="dialog"]')),
    })
  ) {
    return;
  }
  if (!sel || sel.rangeCount === 0) return;
  sel.removeAllRanges();
}

/** iPhone / iPad (including iPadOS desktop-class UA). Not Mac desktops. */
export function isAppleTouchDevice(opts?: {
  userAgent?: string;
  platform?: string;
  maxTouchPoints?: number;
}): boolean {
  const ua =
    opts?.userAgent ??
    (typeof navigator !== "undefined" ? navigator.userAgent : "");
  const platform =
    opts?.platform ??
    (typeof navigator !== "undefined" ? navigator.platform : "");
  const maxTouch =
    opts?.maxTouchPoints ??
    (typeof navigator !== "undefined" ? navigator.maxTouchPoints : 0);
  if (/iPhone|iPod|iPad/i.test(ua) || /iPhone|iPod|iPad/i.test(platform)) {
    return true;
  }
  return platform === "MacIntel" && maxTouch > 1;
}

/**
 * Whether to cancel the browser default on an ink pointerdown.
 *
 * Android Chrome + S Pen: preventDefault → pointercancel → dead stroke.
 * iPad Chrome: skipping it lets a second Pencil tap open Copy / Translate / Share
 * (text selection + Live Text on the PDF canvas).
 */
export function shouldPreventInkPointerDown(
  e: { pointerType: string },
  appleTouch = isAppleTouchDevice()
): boolean {
  if (e.pointerType !== "pen") return true;
  return appleTouch;
}

/**
 * True when a fine pointer exists (mouse / trackpad / Apple Pencil capability).
 * On those devices finger pans the page; stylus/mouse draw.
 * Phones (coarse only) still draw with a finger.
 */
export function prefersFingerScroll(
  hasFinePointer = typeof window !== "undefined"
    ? window.matchMedia("(any-pointer: fine)").matches
    : false
): boolean {
  return hasFinePointer;
}

/** Whether this pointer should start an ink / highlight stroke. */
export function isPrimaryInkPointer(
  e: {
    button: number;
    pointerType: string;
  },
  opts?: { hasFinePointer?: boolean }
): boolean {
  if (e.pointerType === "mouse") return e.button === 0;
  // Apple Pencil and Samsung S Pen both report as "pen". Tip contact is
  // usually button 0; some Android / iPadOS builds use -1 during the down event.
  if (e.pointerType === "pen") return e.button === 0 || e.button === -1;
  if (e.pointerType === "touch") {
    if (prefersFingerScroll(opts?.hasFinePointer)) return false;
    return e.button === 0 || e.button === -1;
  }
  return false;
}

/**
 * Every position a pointer passed through since the last move event.
 *
 * A stylus samples several times faster than the screen refreshes, and the
 * browser folds those extra samples into one pointermove. Reading only the
 * event itself throws them away, which is what makes fast handwriting come out
 * as straight segments with corners cut off.
 */
export function strokeSamples(e: {
  nativeEvent: PointerEvent;
  clientX: number;
  clientY: number;
}): Array<{ clientX: number; clientY: number }> {
  const coalesced = e.nativeEvent.getCoalescedEvents?.();
  return coalesced && coalesced.length > 0 ? coalesced : [e];
}

/**
 * Block iOS callouts and native selection while drawing.
 *
 * Finger pans are left alone (touch-action + two-finger scroll in JS). We only
 * cancel stylus defaults on Apple — Android S Pen dies if pointerdown is
 * cancelled.
 */
export function bindInkSurface(el: HTMLElement): () => void {
  const prevent = (e: Event) => {
    if (e.cancelable) e.preventDefault();
  };
  let lastApplePen = false;

  const onPointerDown = (e: PointerEvent) => {
    if (!isPrimaryInkPointer(e)) {
      lastApplePen = false;
      return;
    }
    lastApplePen = e.pointerType === "pen" && isAppleTouchDevice();
    if (!shouldPreventInkPointerDown(e)) return;
    if (e.cancelable) e.preventDefault();
    clearNativeSelection();
  };

  const onClick = (e: Event) => {
    if (lastApplePen && e.cancelable) e.preventDefault();
    if (lastApplePen) clearNativeSelection();
  };

  const onTouchEnd = (e: TouchEvent) => {
    if (!isAppleTouchDevice()) return;
    const stylus = Array.from(e.changedTouches).some(
      (t) => (t as Touch & { touchType?: string }).touchType === "stylus"
    );
    if (!stylus) return;
    if (e.cancelable) e.preventDefault();
    clearNativeSelection();
  };

  el.addEventListener("selectstart", prevent, true);
  el.addEventListener("contextmenu", prevent, true);
  el.addEventListener("dragstart", prevent, true);
  el.addEventListener("gesturestart", prevent, true);
  el.addEventListener("pointerdown", onPointerDown, {
    capture: true,
    passive: false,
  });
  el.addEventListener("click", onClick, true);
  el.addEventListener("touchend", onTouchEnd, {
    capture: true,
    passive: false,
  });
  const onSelectionChange = () => {
    const sel = window.getSelection();
    const node = sel?.anchorNode ?? null;
    if (node && !el.contains(node) && !(node.parentElement && el.contains(node.parentElement))) {
      return;
    }
    clearNativeSelection();
  };

  document.addEventListener("selectionchange", onSelectionChange);

  clearNativeSelection();
  const active = document.activeElement;
  if (
    active instanceof HTMLElement &&
    el.contains(active) &&
    !isEditableTarget(active) &&
    !document.querySelector('[role="dialog"]')
  ) {
    active.blur();
  }

  return () => {
    el.removeEventListener("selectstart", prevent, true);
    el.removeEventListener("contextmenu", prevent, true);
    el.removeEventListener("dragstart", prevent, true);
    el.removeEventListener("gesturestart", prevent, true);
    el.removeEventListener("pointerdown", onPointerDown, true);
    el.removeEventListener("click", onClick, true);
    el.removeEventListener("touchend", onTouchEnd, true);
    document.removeEventListener("selectionchange", onSelectionChange);
  };
}
