"use client";

import { useEffect, useState } from "react";

const PHONE_MQ = "(max-width: 767px)";

/** True on phone-width viewports only — not iPad / tablet. */
export function useIsPhone(): boolean {
  const [phone, setPhone] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(PHONE_MQ);
    const sync = () => setPhone(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    window.addEventListener("orientationchange", sync);
    return () => {
      mq.removeEventListener("change", sync);
      window.removeEventListener("orientationchange", sync);
    };
  }, []);

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
