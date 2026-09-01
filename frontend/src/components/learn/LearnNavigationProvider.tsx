"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { LearnReaderSkeleton } from "@/components/learn/LearnReaderSkeleton";

function isLearnArticlePath(pathname: string): boolean {
  const parts = pathname.replace(/^\/learn\/?/, "").split("/").filter(Boolean);
  return parts.length >= 3;
}

const LearnNavigationContext = createContext<{
  openingReader: boolean;
  startReaderOpen: (href: string) => void;
  clearReaderOpen: () => void;
} | null>(null);

export function LearnNavigationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [openingReader, setOpeningReader] = useState(false);

  const startReaderOpen = useCallback((href: string) => {
    if (isLearnArticlePath(href)) {
      setOpeningReader(true);
    }
  }, []);

  const clearReaderOpen = useCallback(() => {
    setOpeningReader(false);
  }, []);

  useEffect(() => {
    if (!openingReader) return;
    const timeout = window.setTimeout(() => setOpeningReader(false), 12000);
    return () => window.clearTimeout(timeout);
  }, [openingReader]);

  return (
    <LearnNavigationContext.Provider
      value={{ openingReader, startReaderOpen, clearReaderOpen }}
    >
      {children}
      {openingReader ? (
        <div
          className="fixed inset-0 z-[80] bg-[var(--bg-primary)]"
          aria-busy
          aria-label="Opening document"
        >
          <LearnReaderSkeleton />
        </div>
      ) : null}
    </LearnNavigationContext.Provider>
  );
}

export function useLearnNavigation() {
  const ctx = useContext(LearnNavigationContext);
  return (
    ctx ?? {
      openingReader: false,
      startReaderOpen: () => {},
      clearReaderOpen: () => {},
    }
  );
}
