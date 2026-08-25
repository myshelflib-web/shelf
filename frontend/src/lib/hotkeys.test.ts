import { describe, expect, it } from "vitest";
import {
  eventChord,
  formatChord,
  withShortcut,
  isHotkeysSuppressed,
  isOverlayOpen,
  isTypingTarget,
  isTouchPrimaryUi,
  matchHotkey,
  type HotkeyBinding,
} from "./hotkeys";

function chord(
  key: string,
  mods: Partial<{
    metaKey: boolean;
    ctrlKey: boolean;
    altKey: boolean;
    shiftKey: boolean;
    isComposing: boolean;
  }> = {}
) {
  return { key, ...mods };
}

const bindings: HotkeyBinding[] = [
  { id: "search", keys: "mod+k", allowInInput: true },
  { id: "save", keys: "mod+s", allowInInput: true },
  { id: "help", keys: "?", allowInModal: true },
  { id: "library", keys: "g l" },
  { id: "notebook", keys: "c n" },
  { id: "page", keys: "c p" },
  { id: "close-tab", keys: "w" },
  { id: "prev-tab", keys: "{" },
  { id: "new-event", keys: "shift+n" },
];

describe("eventChord", () => {
  it("normalizes modifier search and sequences", () => {
    expect(eventChord(chord("k", { metaKey: true }))).toBe("mod+k");
    expect(eventChord(chord("k", { ctrlKey: true }))).toBe("mod+k");
    expect(eventChord(chord("N", { shiftKey: true }))).toBe("shift+n");
    expect(eventChord(chord("?"))).toBe("?");
    expect(eventChord(chord("/"))).toBe("/");
    expect(eventChord(chord("{"))).toBe("{");
    expect(eventChord(chord("Escape"))).toBe("escape");
    expect(eventChord(chord("ArrowLeft"))).toBe("left");
    expect(eventChord(chord("Shift"))).toBeNull();
    expect(eventChord(chord("g", { isComposing: true }))).toBeNull();
  });
});

describe("matchHotkey", () => {
  it("fires modifier shortcuts immediately", () => {
    expect(matchHotkey(bindings, chord("k", { metaKey: true }), null)).toEqual({
      type: "fire",
      id: "search",
    });
  });

  it("starts a go-to sequence on g, then fires on l", () => {
    expect(matchHotkey(bindings, chord("g"), null)).toEqual({
      type: "pending",
      prefix: "g",
    });
    expect(matchHotkey(bindings, chord("l"), "g")).toEqual({
      type: "fire",
      id: "library",
    });
  });

  it("falls back when the second sequence key misses", () => {
    expect(matchHotkey(bindings, chord("w"), "g")).toEqual({
      type: "fire",
      id: "close-tab",
    });
  });

  it("matches shifted punctuation and letters", () => {
    expect(matchHotkey(bindings, chord("{"), null)).toEqual({
      type: "fire",
      id: "prev-tab",
    });
    expect(matchHotkey(bindings, chord("n", { shiftKey: true }), null)).toEqual({
      type: "fire",
      id: "new-event",
    });
  });
});

describe("isTypingTarget", () => {
  it("treats text fields and contenteditable as typing", () => {
    expect(isTypingTarget({ tagName: "INPUT", type: "text" })).toBe(true);
    expect(isTypingTarget({ tagName: "TEXTAREA" })).toBe(true);
    expect(isTypingTarget({ tagName: "SELECT" })).toBe(true);
    expect(isTypingTarget({ isContentEditable: true })).toBe(true);
    expect(
      isTypingTarget({ tagName: "DIV", getAttribute: () => "textbox" })
    ).toBe(true);
  });

  it("allows shortcuts on buttons and non-text inputs", () => {
    expect(isTypingTarget({ tagName: "BUTTON" })).toBe(false);
    expect(isTypingTarget({ tagName: "INPUT", type: "checkbox" })).toBe(false);
    expect(isTypingTarget({ tagName: "DIV" })).toBe(false);
  });
});

describe("overlays and suppressed tools", () => {
  it("detects dialogs", () => {
    expect(
      isOverlayOpen({
        querySelector: (sel) =>
          sel.includes("dialog") ? { role: "dialog" } : null,
      })
    ).toBe(true);
    expect(isOverlayOpen({ querySelector: () => null })).toBe(false);
  });

  it("ignores hidden (aria-hidden) tool surfaces", () => {
    expect(
      isHotkeysSuppressed({
        querySelectorAll: () => [
          { closest: (s: string) => (s.includes("aria-hidden") ? {} : null) },
        ],
      })
    ).toBe(false);
    expect(
      isHotkeysSuppressed({
        querySelectorAll: () => [{ closest: () => null }],
      })
    ).toBe(true);
  });
});

describe("isTouchPrimaryUi", () => {
  it("detects phones, iPads, and coarse touch UIs", () => {
    expect(
      isTouchPrimaryUi({
        userAgent: "iPhone",
        hoverNone: false,
        coarsePointer: false,
      })
    ).toBe(true);
    expect(
      isTouchPrimaryUi({
        userAgent: "Mozilla/5.0",
        platform: "MacIntel",
        maxTouchPoints: 5,
        hoverNone: false,
        coarsePointer: false,
      })
    ).toBe(true);
    expect(
      isTouchPrimaryUi({
        userAgent: "Mozilla/5.0",
        platform: "MacIntel",
        maxTouchPoints: 0,
        hoverNone: true,
        coarsePointer: true,
      })
    ).toBe(true);
    expect(
      isTouchPrimaryUi({
        userAgent: "Mozilla/5.0",
        platform: "MacIntel",
        maxTouchPoints: 0,
        hoverNone: false,
        coarsePointer: false,
      })
    ).toBe(false);
  });
});

describe("formatChord", () => {
  it("formats mac and windows chords", () => {
    expect(formatChord("mod+k", true)).toBe("⌘K");
    expect(formatChord("mod+k", false)).toBe("Ctrl+K");
    expect(formatChord("g l", true)).toBe("G then L");
    expect(formatChord("shift+n", true)).toBe("⇧N");
    expect(formatChord("escape", true)).toBe("Esc");
  });

  it("appends a shortcut to a tooltip label", () => {
    expect(withShortcut("Search library", "mod+k", true)).toBe(
      "Search library (⌘K)"
    );
    expect(withShortcut("Previous page", "left", true)).toBe(
      "Previous page (←)"
    );
  });
});
