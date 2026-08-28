"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  matchHotkey,
  isTypingTarget,
  isHotkeysSuppressed,
  isOverlayOpen,
  isQuizProctorActive,
  SEQUENCE_MS,
  type HotkeyBinding,
} from "@/lib/hotkeys";
import { useTouchPrimaryUi } from "@/hooks/useTouchPrimaryUi";

type Handler = (e: KeyboardEvent) => void;

type Registered = HotkeyBinding & { handler: Handler };

interface HotkeysContextValue {
  openSearch: () => void;
  closeSearch: () => void;
  searchOpen: boolean;
  openHelp: () => void;
  closeHelp: () => void;
  toggleHelp: () => void;
  helpOpen: boolean;
  register: (binding: Registered) => () => void;
}

const HotkeysContext = createContext<HotkeysContextValue | null>(null);

export function HotkeysProvider({ children }: { children: ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const bindingsRef = useRef<Registered[]>([]);
  const pendingRef = useRef<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const touchPrimary = useTouchPrimaryUi();

  const clearPending = useCallback(() => {
    pendingRef.current = null;
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const register = useCallback((binding: Registered) => {
    bindingsRef.current = [...bindingsRef.current, binding];
    return () => {
      bindingsRef.current = bindingsRef.current.filter((b) => b !== binding);
    };
  }, []);

  useEffect(() => {
    if (touchPrimary) {
      clearPending();
      return;
    }

    const onKey = (e: KeyboardEvent) => {
      if (isQuizProctorActive()) return;
      const typing =
        isTypingTarget(e.target) || isTypingTarget(document.activeElement);
      const suppressed = isHotkeysSuppressed();
      const modal = isOverlayOpen();
      const eligible = bindingsRef.current.filter((b) => {
        if (b.enabled === false) return false;
        if (typing && !b.allowInInput) return false;
        if (suppressed && !b.allowWhenSuppressed && !b.allowInInput) {
          return false;
        }
        if (modal && !b.allowInModal) return false;
        return true;
      });

      const result = matchHotkey(eligible, e, pendingRef.current);

      if (result.type === "pending") {
        pendingRef.current = result.prefix;
        if (timerRef.current != null) window.clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(clearPending, SEQUENCE_MS);
        e.preventDefault();
        return;
      }

      if (result.type === "fire") {
        clearPending();
        const hit = bindingsRef.current.find((b) => b.id === result.id);
        if (!hit) return;
        e.preventDefault();
        hit.handler(e);
        return;
      }

      if (pendingRef.current) clearPending();
    };

    window.addEventListener("keydown", onKey, true);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
    };
  }, [clearPending, touchPrimary]);

  const value: HotkeysContextValue = {
    openSearch: () => {
      setHelpOpen(false);
      setSearchOpen(true);
    },
    closeSearch: () => setSearchOpen(false),
    searchOpen,
    openHelp: () => {
      setSearchOpen(false);
      setHelpOpen(true);
    },
    closeHelp: () => setHelpOpen(false),
    toggleHelp: () => {
      setSearchOpen(false);
      setHelpOpen((v) => !v);
    },
    helpOpen,
    register,
  };

  return (
    <HotkeysContext.Provider value={value}>{children}</HotkeysContext.Provider>
  );
}

export function useHotkeysController() {
  const ctx = useContext(HotkeysContext);
  if (!ctx) throw new Error("useHotkeysController must be used within HotkeysProvider");
  return ctx;
}

export function useHotkey(
  keys: string,
  handler: Handler,
  options?: {
    allowInInput?: boolean;
    allowInModal?: boolean;
    allowWhenSuppressed?: boolean;
    enabled?: boolean;
  }
) {
  const ctx = useContext(HotkeysContext);
  const reactId = useId();
  const handlerRef = useRef(handler);
  handlerRef.current = handler;
  const allowInInput = options?.allowInInput;
  const allowInModal = options?.allowInModal;
  const allowWhenSuppressed = options?.allowWhenSuppressed;
  const enabled = options?.enabled;

  useEffect(() => {
    if (!ctx) return;
    if (enabled === false) return;
    return ctx.register({
      id: `${reactId}:${keys}`,
      keys,
      allowInInput,
      allowInModal,
      allowWhenSuppressed,
      enabled: true,
      handler: (e) => handlerRef.current(e),
    });
  }, [ctx, reactId, keys, allowInInput, allowInModal, allowWhenSuppressed, enabled]);
}
