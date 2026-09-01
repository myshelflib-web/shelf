"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export const LEARN_BROWSE_RETURN_MS = 280;

function isLearnArticlePath(pathname: string): boolean {
  const parts = pathname.replace(/^\/learn\/?/, "").split("/").filter(Boolean);
  return parts.length >= 3;
}

function browseReturnDurationMs(): number {
  if (typeof window === "undefined") return LEARN_BROWSE_RETURN_MS;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? 0
    : LEARN_BROWSE_RETURN_MS;
}

const LearnNavigationContext = createContext<{
  openingReader: boolean;
  returningToBrowse: boolean;
  startReaderOpen: (href: string) => void;
  clearReaderOpen: () => void;
  startBrowseReturn: () => number;
  completeBrowseReturn: () => void;
} | null>(null);

export function LearnNavigationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [openingReader, setOpeningReader] = useState(false);
  const [returningToBrowse, setReturningToBrowse] = useState(false);

  const startReaderOpen = useCallback((href: string) => {
    if (isLearnArticlePath(href)) {
      setOpeningReader(true);
    }
  }, []);

  const clearReaderOpen = useCallback(() => {
    setOpeningReader(false);
  }, []);

  const startBrowseReturn = useCallback(() => {
    setReturningToBrowse(true);
    return browseReturnDurationMs();
  }, []);

  const completeBrowseReturn = useCallback(() => {
    setReturningToBrowse(false);
  }, []);

  useEffect(() => {
    if (!openingReader) return;
    const timeout = window.setTimeout(() => setOpeningReader(false), 12000);
    return () => window.clearTimeout(timeout);
  }, [openingReader]);

  return (
    <LearnNavigationContext.Provider
      value={{
        openingReader,
        returningToBrowse,
        startReaderOpen,
        clearReaderOpen,
        startBrowseReturn,
        completeBrowseReturn,
      }}
    >
      {children}
    </LearnNavigationContext.Provider>
  );
}

export function useLearnNavigation() {
  const ctx = useContext(LearnNavigationContext);
  return (
    ctx ?? {
      openingReader: false,
      returningToBrowse: false,
      startReaderOpen: () => {},
      clearReaderOpen: () => {},
      startBrowseReturn: () => 0,
      completeBrowseReturn: () => {},
    }
  );
}
