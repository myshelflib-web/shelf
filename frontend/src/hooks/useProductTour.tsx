"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { ProductTourOverlay } from "@/components/product-tour/ProductTourOverlay";
import { useAuth } from "@/hooks/useAuth";
import { needsOnboarding } from "@/lib/onboarding";
import { stepsForSurface } from "@/lib/productTour/steps";
import {
  isTourDone,
  isNewEnoughForProductTour,
  markTourDone,
  resetAllTours,
  resetTour,
  skipProductToursForLegacyUser,
  surfaceFromPathname,
  type TourSurface,
} from "@/lib/productTour/storage";

interface ProductTourContextValue {
  activeSurface: TourSurface | null;
  startTour: (surface: TourSurface) => void;
  resetAndStart: (surface?: TourSurface | "all") => void;
  skipAll: () => void;
}

const ProductTourContext = createContext<ProductTourContextValue | null>(null);

function parseTourQuery(value: string | null): "surface" | "all" | null {
  if (!value) return null;
  const v = value.toLowerCase();
  if (v === "1" || v === "replay" || v === "true") return "surface";
  if (v === "all") return "all";
  return null;
}

function readTourQueryFromLocation(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return new URL(window.location.href).searchParams.get("tour");
  } catch {
    return null;
  }
}

function stripTourQueryFromLocation() {
  try {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("tour")) return;
    url.searchParams.delete("tour");
    window.history.replaceState({}, "", url.pathname + url.search + url.hash);
  } catch {
    /* ignore */
  }
}

export function ProductTourProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname() ?? "";
  const router = useRouter();

  const [activeSurface, setActiveSurface] = useState<TourSurface | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const startedRef = useRef<string | null>(null);
  const queryHandledRef = useRef<string | null>(null);
  const stepIndexRef = useRef(0);
  stepIndexRef.current = stepIndex;

  const steps = useMemo(
    () => (activeSurface ? stepsForSurface(activeSurface) : []),
    [activeSurface]
  );

  const finish = useCallback(
    (status: "done" | "skipped") => {
      if (activeSurface && user) {
        markTourDone(activeSurface, user.id, status);
      }
      setActiveSurface(null);
      setStepIndex(0);
      startedRef.current = null;
    },
    [activeSurface, user]
  );

  const skipAll = useCallback(() => {
    finish("skipped");
  }, [finish]);

  const startTour = useCallback(
    (surface: TourSurface) => {
      if (!user) return;
      const nextSteps = stepsForSurface(surface);
      if (nextSteps.length === 0) return;
      startedRef.current = `${user.id}:${surface}`;
      setActiveSurface(surface);
      setStepIndex(0);
    },
    [user]
  );

  const resetAndStart = useCallback(
    (surface: TourSurface | "all" = "all") => {
      if (!user) return;
      if (surface === "all") {
        resetAllTours(user.id);
        router.push("/my-content?tour=1");
        return;
      }
      resetTour(surface, user.id);
      startTour(surface);
    },
    [user, router, startTour]
  );

  const onNext = useCallback(() => {
    if (!activeSurface) return;
    if (stepIndexRef.current >= steps.length - 1) {
      finish("done");
      return;
    }
    setStepIndex((i) => i + 1);
  }, [activeSurface, steps.length, finish]);

  // Handle ?tour=1 | replay | all (read from window to avoid Suspense on searchParams)
  useEffect(() => {
    if (!user || needsOnboarding(user)) return;
    const raw = readTourQueryFromLocation();
    const mode = parseTourQuery(raw);
    if (!mode) {
      queryHandledRef.current = null;
      return;
    }
    const key = `${pathname}?tour=${raw}`;
    if (queryHandledRef.current === key) return;
    queryHandledRef.current = key;

    if (mode === "all") {
      resetAllTours(user.id);
      const surface = surfaceFromPathname(pathname) ?? "library";
      startTour(surface);
    } else {
      const surface = surfaceFromPathname(pathname);
      if (surface) {
        resetTour(surface, user.id);
        startTour(surface);
      }
    }

    stripTourQueryFromLocation();
  }, [user, pathname, startTour]);

  // Stamp legacy accounts so auto-tours never appear for them
  useEffect(() => {
    if (!user || needsOnboarding(user)) return;
    skipProductToursForLegacyUser(user);
  }, [user]);

  // Auto-start when visiting an eligible surface (new accounts only)
  useEffect(() => {
    if (!user || needsOnboarding(user)) return;
    if (!isNewEnoughForProductTour(user)) return;
    if (activeSurface) return;
    if (parseTourQuery(readTourQueryFromLocation())) return;
    const surface = surfaceFromPathname(pathname);
    if (!surface) return;
    if (isTourDone(surface, user.id)) return;
    const key = `${user.id}:${surface}`;
    if (startedRef.current === key) return;
    const t = window.setTimeout(() => {
      if (isTourDone(surface, user.id)) return;
      startTour(surface);
    }, 400);
    return () => window.clearTimeout(t);
  }, [user, pathname, activeSurface, startTour]);

  const value = useMemo(
    () => ({
      activeSurface,
      startTour,
      resetAndStart,
      skipAll,
    }),
    [activeSurface, startTour, resetAndStart, skipAll]
  );

  return (
    <ProductTourContext.Provider value={value}>
      {children}
      {activeSurface && steps.length > 0 ? (
        <ProductTourOverlay
          steps={steps}
          stepIndex={stepIndex}
          onNext={onNext}
          onSkipAll={skipAll}
        />
      ) : null}
    </ProductTourContext.Provider>
  );
}

export function useProductTour(): ProductTourContextValue {
  const ctx = useContext(ProductTourContext);
  if (!ctx) {
    throw new Error("useProductTour must be used within ProductTourProvider");
  }
  return ctx;
}
