import { describe, expect, it } from "vitest";
import {
  isAppleTouchDevice,
  isEditableTarget,
  isPrimaryInkPointer,
  prefersFingerScroll,
  shouldClearNativeSelection,
  shouldPreventInkPointerDown,
  strokeSamples,
} from "./inkSurface";

describe("prefersFingerScroll", () => {
  it("is true when a fine pointer is available", () => {
    expect(prefersFingerScroll(true)).toBe(true);
    expect(prefersFingerScroll(false)).toBe(false);
  });
});

describe("strokeSamples", () => {
  const move = (
    clientX: number,
    clientY: number,
    coalesced?: Array<{ clientX: number; clientY: number }>
  ) =>
    ({
      clientX,
      clientY,
      nativeEvent: {
        getCoalescedEvents: coalesced ? () => coalesced : undefined,
      },
    }) as unknown as Parameters<typeof strokeSamples>[0];

  it("returns every intermediate sample the pointer reported", () => {
    const points = [
      { clientX: 1, clientY: 1 },
      { clientX: 2, clientY: 2 },
      { clientX: 3, clientY: 3 },
    ];
    expect(strokeSamples(move(3, 3, points))).toEqual(points);
  });

  it("falls back to the event itself when coalescing is unavailable", () => {
    expect(strokeSamples(move(4, 5))).toEqual([
      expect.objectContaining({ clientX: 4, clientY: 5 }),
    ]);
  });

  it("falls back to the event itself when the coalesced list is empty", () => {
    expect(strokeSamples(move(4, 5, []))).toEqual([
      expect.objectContaining({ clientX: 4, clientY: 5 }),
    ]);
  });
});

describe("shouldClearNativeSelection", () => {
  it("keeps the caret while typing in a field", () => {
    expect(
      shouldClearNativeSelection({
        active: { tagName: "INPUT" },
      })
    ).toBe(false);
    expect(
      isEditableTarget({ tagName: "TEXTAREA" })
    ).toBe(true);
  });

  it("does not steal the caret while a dialog is open", () => {
    expect(shouldClearNativeSelection({ dialogOpen: true })).toBe(false);
  });

  it("clears page selection while drawing on the surface", () => {
    expect(
      shouldClearNativeSelection({
        active: { tagName: "DIV" },
        dialogOpen: false,
      })
    ).toBe(true);
  });
});

describe("isAppleTouchDevice", () => {
  it("detects iPadOS desktop-class UA", () => {
    expect(
      isAppleTouchDevice({
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        platform: "MacIntel",
        maxTouchPoints: 5,
      })
    ).toBe(true);
  });

  it("does not treat a Mac desktop as an iPad", () => {
    expect(
      isAppleTouchDevice({
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        platform: "MacIntel",
        maxTouchPoints: 0,
      })
    ).toBe(false);
  });
});

describe("shouldPreventInkPointerDown", () => {
  it("cancels Apple Pencil so Chrome does not open Copy / Translate / Share", () => {
    expect(shouldPreventInkPointerDown({ pointerType: "pen" }, true)).toBe(true);
  });

  it("does not cancel Android S Pen (Chrome would pointercancel the stroke)", () => {
    expect(shouldPreventInkPointerDown({ pointerType: "pen" }, false)).toBe(
      false
    );
  });

  it("cancels mouse and finger drawing on every platform", () => {
    expect(shouldPreventInkPointerDown({ pointerType: "mouse" }, false)).toBe(
      true
    );
    expect(shouldPreventInkPointerDown({ pointerType: "touch" }, false)).toBe(
      true
    );
  });
});

describe("isPrimaryInkPointer", () => {
  it("allows a mouse left click and rejects other mouse buttons", () => {
    expect(isPrimaryInkPointer({ button: 0, pointerType: "mouse" })).toBe(true);
    expect(isPrimaryInkPointer({ button: 2, pointerType: "mouse" })).toBe(false);
  });

  it("allows stylus contact, including iOS button -1", () => {
    expect(isPrimaryInkPointer({ button: 0, pointerType: "pen" })).toBe(true);
    expect(isPrimaryInkPointer({ button: -1, pointerType: "pen" })).toBe(true);
  });

  it("does not draw with a finger when a fine pointer exists (iPad + Pencil)", () => {
    expect(
      isPrimaryInkPointer(
        { button: 0, pointerType: "touch" },
        { hasFinePointer: true }
      )
    ).toBe(false);
  });

  it("draws with a finger on coarse-only devices (phones)", () => {
    expect(
      isPrimaryInkPointer(
        { button: 0, pointerType: "touch" },
        { hasFinePointer: false }
      )
    ).toBe(true);
    expect(
      isPrimaryInkPointer(
        { button: -1, pointerType: "touch" },
        { hasFinePointer: false }
      )
    ).toBe(true);
  });

  it("ignores pointer types it does not understand", () => {
    expect(isPrimaryInkPointer({ button: 0, pointerType: "" })).toBe(false);
  });
});
