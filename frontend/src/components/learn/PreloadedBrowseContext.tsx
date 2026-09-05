"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useLearnSubjects } from "@/hooks/useLearnSubjects";
import {
  PreloadedBrowsePath,
  withResolvedArea,
} from "@/lib/preloadedBrowse";

type PreloadedBrowseContextValue = {
  path: PreloadedBrowsePath;
  setPath: (next: PreloadedBrowsePath) => void;
  interceptFolderNav: boolean;
};

const PreloadedBrowseContext =
  createContext<PreloadedBrowseContextValue | null>(null);

/** Shared Preloaded folder selection (left tree ↔ middle pane). */
export function PreloadedBrowseProvider({
  children,
  initialPath,
}: {
  children: React.ReactNode;
  initialPath?: PreloadedBrowsePath;
}) {
  const { subjects } = useLearnSubjects();
  const [raw, setRaw] = useState<PreloadedBrowsePath>(initialPath ?? {});

  const setPath = useCallback((next: PreloadedBrowsePath) => {
    setRaw(next);
  }, []);

  const path = useMemo(
    () => withResolvedArea(raw, subjects),
    [raw, subjects]
  );

  const value = useMemo(
    () => ({ path, setPath, interceptFolderNav: true }),
    [path, setPath]
  );

  return (
    <PreloadedBrowseContext.Provider value={value}>
      {children}
    </PreloadedBrowseContext.Provider>
  );
}

export function useOptionalPreloadedBrowse() {
  return useContext(PreloadedBrowseContext);
}
