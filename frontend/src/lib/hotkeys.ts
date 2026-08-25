const NON_TEXT_INPUT = new Set([
  "button",
  "checkbox",
  "radio",
  "submit",
  "reset",
  "file",
  "range",
  "color",
  "hidden",
]);

const MODIFIER_KEYS = new Set(["Shift", "Control", "Alt", "Meta"]);

export type HotkeyBinding = {
  id: string;
  /** Chord like `mod+k`, `shift+n`, `?`, or a sequence `g l`. */
  keys: string;
  allowInInput?: boolean;
  allowInModal?: boolean;
  /** Fire even while pen/draw/clip sets `data-shelf-hotkeys="off"`. */
  allowWhenSuppressed?: boolean;
  enabled?: boolean;
};

export type MatchResult =
  | { type: "fire"; id: string }
  | { type: "pending"; prefix: string }
  | { type: "none" };

type ChordEvent = {
  key: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  isComposing?: boolean;
  repeat?: boolean;
};

type TypingEl = {
  tagName?: string;
  isContentEditable?: boolean;
  type?: string;
  getAttribute?: (name: string) => string | null;
  closest?: (selector: string) => unknown;
};

/** True when a keypress should go to the focused field, not app shortcuts. */
export function isTypingTarget(target: EventTarget | TypingEl | null): boolean {
  if (!target || typeof target !== "object") return false;
  const el = target as TypingEl;
  if (el.isContentEditable) return true;
  const tag = (el.tagName || "").toUpperCase();
  if (tag === "TEXTAREA" || tag === "SELECT") return true;
  if (tag === "INPUT") {
    const type = (el.type || "text").toLowerCase();
    return !NON_TEXT_INPUT.has(type);
  }
  const role = el.getAttribute?.("role");
  if (role === "textbox" || role === "combobox" || role === "searchbox") {
    return true;
  }
  return false;
}

type QueryRoot = { querySelector: (sel: string) => unknown };
type QueryAllRoot = {
  querySelectorAll: (sel: string) => ArrayLike<{ closest?: (s: string) => unknown }>;
};

export function isOverlayOpen(
  root: QueryRoot | null = typeof document !== "undefined" ? document : null
): boolean {
  if (!root) return false;
  return Boolean(root.querySelector('[role="dialog"], [aria-modal="true"]'));
}

/**
 * Pen / draw / clip tools set `data-shelf-hotkeys="off"` on the active surface.
 * Hidden (warm) tabs are `aria-hidden` so they do not suppress shortcuts.
 */
export function isHotkeysSuppressed(
  root: QueryAllRoot | null = typeof document !== "undefined" ? document : null
): boolean {
  if (!root) return false;
  const nodes = root.querySelectorAll('[data-shelf-hotkeys="off"]');
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    if (n?.closest?.('[aria-hidden="true"]')) continue;
    return true;
  }
  return false;
}

export function shouldIgnorePlainKeys(
  target: EventTarget | TypingEl | null,
  root?: QueryAllRoot | null
): boolean {
  return isTypingTarget(target) || isHotkeysSuppressed(root);
}

/** Phones, tablets, and iPadOS (incl. desktop-class UA) — skip keyboard shortcuts. */
export function isTouchPrimaryUi(opts?: {
  userAgent?: string;
  maxTouchPoints?: number;
  platform?: string;
  hoverNone?: boolean;
  coarsePointer?: boolean;
}): boolean {
  const ua =
    opts?.userAgent ??
    (typeof navigator !== "undefined" ? navigator.userAgent : "");
  const maxTouch =
    opts?.maxTouchPoints ??
    (typeof navigator !== "undefined" ? navigator.maxTouchPoints : 0);
  const platform =
    opts?.platform ??
    (typeof navigator !== "undefined" ? navigator.platform : "");

  if (/Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
    return true;
  }
  if (/iPad/i.test(ua) || (platform === "MacIntel" && maxTouch > 1)) {
    return true;
  }

  const hoverNone =
    opts?.hoverNone ??
    (typeof window !== "undefined" &&
      window.matchMedia("(hover: none)").matches);
  const coarsePointer =
    opts?.coarsePointer ??
    (typeof window !== "undefined" &&
      window.matchMedia("(pointer: coarse)").matches);
  return hoverNone && coarsePointer;
}

export function isApplePlatform(
  platform = typeof navigator !== "undefined" ? navigator.platform : ""
): boolean {
  return /Mac|iPhone|iPad|iPod/.test(platform);
}

export function eventChord(e: ChordEvent): string | null {
  if (e.isComposing) return null;
  if (MODIFIER_KEYS.has(e.key)) return null;
  const key = normalizeKey(e.key);
  if (!key) return null;
  const parts: string[] = [];
  if (e.metaKey || e.ctrlKey) parts.push("mod");
  if (e.altKey) parts.push("alt");
  const letter = /^[a-z]$/i.test(e.key);
  if (e.shiftKey && (letter || key.length > 1)) parts.push("shift");
  parts.push(letter ? e.key.toLowerCase() : key);
  return parts.join("+");
}

function normalizeKey(key: string): string {
  if (key === " ") return "space";
  if (key === "Escape") return "escape";
  if (key === "Esc") return "escape";
  if (key === "Enter") return "enter";
  if (key === "Tab") return "tab";
  if (key === "ArrowLeft") return "left";
  if (key === "ArrowRight") return "right";
  if (key === "ArrowUp") return "up";
  if (key === "ArrowDown") return "down";
  if (key === "Backspace") return "backspace";
  if (key === "Delete") return "delete";
  if (key.length === 1) return key.toLowerCase();
  return key.toLowerCase();
}

export function matchHotkey(
  bindings: HotkeyBinding[],
  e: ChordEvent,
  pending: string | null
): MatchResult {
  const chord = eventChord(e);
  if (!chord) return { type: "none" };

  const active = bindings.filter((b) => b.enabled !== false);
  const exact = (spec: string) =>
    active.filter((b) => b.keys === spec).sort((a, b) => b.keys.length - a.keys.length);

  if (pending) {
    const seq = `${pending} ${chord}`;
    const hit = exact(seq)[0];
    if (hit) return { type: "fire", id: hit.id };
    const stillPrefix = active.some(
      (b) => b.keys.startsWith(`${seq} `) || b.keys === seq
    );
    if (stillPrefix) return { type: "pending", prefix: seq };
    // Fall through and treat this key as a fresh chord.
  }

  const direct = exact(chord)[0];
  const isPrefix = active.some(
    (b) => b.keys.startsWith(`${chord} `) && b.keys !== chord
  );

  if (direct && !isPrefix) return { type: "fire", id: direct.id };
  if (isPrefix) {
    // Prefer a complete single-key binding over starting a sequence when both exist.
    // Sequences always win the first key so `g` can wait for `l`.
    return { type: "pending", prefix: chord };
  }
  if (direct) return { type: "fire", id: direct.id };
  return { type: "none" };
}

export function withShortcut(
  label: string,
  spec: string,
  apple = isApplePlatform()
): string {
  return `${label} (${formatChord(spec, apple)})`;
}

export function getSelectedText(): string {
  if (typeof window === "undefined") return "";
  return window.getSelection()?.toString().replace(/\s+/g, " ").trim() ?? "";
}

export function formatChord(
  spec: string,
  apple = isApplePlatform()
): string {
  return spec
    .split(" ")
    .map((part) =>
      part
        .split("+")
        .map((p) => {
          if (p === "mod") return apple ? "⌘" : "Ctrl";
          if (p === "shift") return apple ? "⇧" : "Shift";
          if (p === "alt") return apple ? "⌥" : "Alt";
          if (p === "escape" || p === "esc") return "Esc";
          if (p === "left") return "←";
          if (p === "right") return "→";
          if (p === "up") return "↑";
          if (p === "down") return "↓";
          if (p === "enter") return "↵";
          if (p.length === 1) return p.toUpperCase();
          return p;
        })
        .join(apple ? "" : "+")
    )
    .join(" then ");
}

export const SEQUENCE_MS = 900;

export const SHELF_OPEN_ADD = "shelf:open-add";

export const HOTKEY_HELP: Array<{
  title: string;
  items: Array<{ keys: string[]; label: string }>;
}> = [
  {
    title: "General",
    items: [
      { keys: ["mod+k", "/"], label: "Search library" },
      { keys: ["?"], label: "Keyboard shortcuts" },
      { keys: ["g l"], label: "Go to Library" },
      { keys: ["g d"], label: "Go to Dashboard" },
      { keys: ["g c"], label: "Go to Planner" },
      { keys: ["g a"], label: "Go to Study AI" },
      { keys: ["g s"], label: "Go to Settings" },
      { keys: ["g p"], label: "Go to Profile" },
      { keys: ["escape"], label: "Close dialog" },
    ],
  },
  {
    title: "Create",
    items: [
      { keys: ["c n"], label: "New collection" },
      { keys: ["c p"], label: "New page" },
      { keys: ["c t"], label: "New topic" },
    ],
  },
  {
    title: "Reader",
    items: [
      { keys: ["mod+l"], label: "Ask Study AI (uses selected text)" },
      { keys: ["mod+b", "["], label: "Toggle library sidebar" },
      { keys: ["mod+j", "]"], label: "Toggle Study AI panel" },
      { keys: ["\\"], label: "Toggle Spotify" },
      { keys: ["mod+\\", "|"], label: "Split editor" },
      { keys: ["{", "}"], label: "Previous / next tab" },
      { keys: ["w"], label: "Close tab" },
      { keys: ["e"], label: "Edit link or imported notes (not blank pages or PDFs)" },
      { keys: ["mod+s"], label: "Save now" },
      { keys: ["escape"], label: "Finish editing a link" },
      { keys: ["s"], label: "Schedule reading" },
      { keys: ["*"], label: "Star page" },
      { keys: ["x"], label: "Mark complete" },
      { keys: ["f"], label: "Fullscreen" },
      { keys: ["left", "right"], label: "Previous / next PDF page" },
      { keys: ["j", "k"], label: "Next / previous PDF page" },
      { keys: ["-", "="], label: "Zoom out / in (pinch or Ctrl+scroll)" },
      { keys: ["m"], label: "PDF night mode" },
    ],
  },
  {
    title: "Planner",
    items: [
      { keys: ["n"], label: "New task" },
      { keys: ["shift+n"], label: "New event" },
      { keys: ["t"], label: "Jump to today" },
      { keys: ["w", "m"], label: "Week / month" },
      { keys: ["left", "right"], label: "Previous / next period" },
    ],
  },
];
