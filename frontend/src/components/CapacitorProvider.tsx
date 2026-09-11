"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/hooks/useTheme";
import { isNativeCapacitor } from "@/lib/capacitorNative";

const STATUS_DARK_BG = "#0c0c0d";
const STATUS_LIGHT_BG = "#f7f7f5";

/**
 * Capacitor-only: status bar theme sync, splash hide, Android back, deep links.
 * No-op on web.
 */
export function CapacitorProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    if (!isNativeCapacitor()) return;
    document.documentElement.dataset.shelfNative = "";
    return () => {
      delete document.documentElement.dataset.shelfNative;
    };
  }, []);

  useEffect(() => {
    if (!isNativeCapacitor()) return;
    let cancelled = false;
    void (async () => {
      try {
        const { StatusBar, Style } = await import("@capacitor/status-bar");
        if (cancelled) return;
        await StatusBar.setStyle({
          style: theme === "dark" ? Style.Dark : Style.Light,
        });
        await StatusBar.setBackgroundColor({
          color: theme === "dark" ? STATUS_DARK_BG : STATUS_LIGHT_BG,
        });
      } catch {
        /* web or plugin missing */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [theme]);

  useEffect(() => {
    if (!isNativeCapacitor()) return;
    void (async () => {
      try {
        const { SplashScreen } = await import("@capacitor/splash-screen");
        await SplashScreen.hide();
      } catch {
        /* ignore */
      }
    })();
  }, []);

  useEffect(() => {
    if (!isNativeCapacitor()) return;
    let handle: { remove: () => Promise<void> } | undefined;
    void (async () => {
      try {
        const { App } = await import("@capacitor/app");
        handle = await App.addListener("backButton", ({ canGoBack }) => {
          if (canGoBack) {
            window.history.back();
            return;
          }
          const path = window.location.pathname;
          if (path !== "/my-content" && path !== "/") {
            router.push("/my-content");
          }
        });
      } catch {
        /* ignore */
      }
    })();
    return () => {
      void handle?.remove();
    };
  }, [router]);

  useEffect(() => {
    if (!isNativeCapacitor()) return;
    let handle: { remove: () => Promise<void> } | undefined;
    void (async () => {
      try {
        const { App } = await import("@capacitor/app");
        handle = await App.addListener("appUrlOpen", ({ url }) => {
          try {
            const parsed = new URL(url);
            if (
              parsed.hostname.endsWith("myshelflib.com") ||
              parsed.hostname === "localhost"
            ) {
              router.push(`${parsed.pathname}${parsed.search}${parsed.hash}`);
            }
          } catch {
            /* ignore bad urls */
          }
        });
      } catch {
        /* ignore */
      }
    })();
    return () => {
      void handle?.remove();
    };
  }, [router]);

  return <>{children}</>;
}
