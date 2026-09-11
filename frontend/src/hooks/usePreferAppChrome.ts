"use client";

import { useSyncExternalStore } from "react";
import { useIsPhone } from "@/hooks/useIsPhone";
import { isNativeCapacitor } from "@/lib/capacitorNative";

function subscribeNative(_onChange: () => void) {
  // Native flag is stable for the page lifetime.
  return () => {};
}

function getNativeSnapshot() {
  return isNativeCapacitor();
}

function getNativeServerSnapshot() {
  return false;
}

/**
 * Phone browser or Capacitor shell — prefer app chrome (no marketing landing,
 * no guest header on auth screens).
 */
export function usePreferAppChrome(): boolean {
  const phone = useIsPhone();
  const native = useSyncExternalStore(
    subscribeNative,
    getNativeSnapshot,
    getNativeServerSnapshot
  );
  return phone || native;
}
