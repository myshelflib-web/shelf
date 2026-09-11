"use client";

import { useEffect, useSyncExternalStore } from "react";

const PHONE_MQ = "(max-width: 767px)";

function subscribePhone(onChange: () => void) {
  const mq = window.matchMedia(PHONE_MQ);
  mq.addEventListener("change", onChange);
  window.addEventListener("orientationchange", onChange);
  return () => {
    mq.removeEventListener("change", onChange);
    window.removeEventListener("orientationchange", onChange);
  };
}

function getPhoneSnapshot() {
  return window.matchMedia(PHONE_MQ).matches;
}

function getPhoneServerSnapshot() {
  return false;
}

/** True on phone-width viewports only — not iPad / tablet. */
export function useIsPhone(): boolean {
  const phone = useSyncExternalStore(
    subscribePhone,
    getPhoneSnapshot,
    getPhoneServerSnapshot
  );

  useEffect(() => {
    const root = document.documentElement;
    if (phone) {
      root.dataset.shelfPhone = "";
    } else {
      delete root.dataset.shelfPhone;
    }
    return () => {
      delete root.dataset.shelfPhone;
    };
  }, [phone]);

  return phone;
}
