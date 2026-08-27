"use client";

import { useAuth } from "@/hooks/useAuth";
import { isDevEnvironment, toUserFacingError } from "@/lib/userFacingError";
import {
  hasTelegramLoginWidget,
  isTelegramLoginHostAllowed,
  readTelegramWidgetError,
} from "@/lib/telegramLoginWidget";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { useEffect, useRef, useState } from "react";

export type TelegramAuthUser = {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
};

interface TelegramSignInButtonProps {
  onError?: (message: string) => void;
  onAvailabilityChange?: (available: boolean) => void;
  redirectTo?: string;
  /** Load widget off-screen to detect availability without showing errors. */
  probeOnly?: boolean;
}

declare global {
  interface Window {
    onShelfTelegramAuth?: (user: TelegramAuthUser) => void;
  }
}

function botUsername(): string | null {
  const raw =
    process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME?.trim() ||
    process.env.TELEGRAM_BOT_USERNAME?.trim() ||
    "";
  if (!raw || /your-telegram|changeme|example/i.test(raw)) return null;
  return raw.replace(/^@/, "");
}

export function isTelegramSignInConfigured(): boolean {
  return Boolean(botUsername());
}

export function TelegramSignInButton({
  onError,
  onAvailabilityChange,
  redirectTo = "/my-content",
  probeOnly = false,
}: TelegramSignInButtonProps) {
  const { loginWithTelegram } = useAuth();
  const router = useRouter();
  const hostRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [widgetReady, setWidgetReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const username = botUsername();

  useEffect(() => {
    if (!username || !isTelegramLoginHostAllowed()) {
      onAvailabilityChange?.(false);
      return;
    }
    onAvailabilityChange?.(false);
  }, [onAvailabilityChange, username]);

  useEffect(() => {
    if (!username || !hostRef.current || !isTelegramLoginHostAllowed()) return;

    setFailed(false);
    setWidgetReady(false);

    window.onShelfTelegramAuth = async (user) => {
      setLoading(true);
      try {
        await loginWithTelegram(user);
        router.push(redirectTo);
      } catch (err) {
        onError?.(
          toUserFacingError(
            err instanceof Error ? err.message : "Telegram sign-in failed",
            "Telegram sign-in failed"
          )
        );
      } finally {
        setLoading(false);
      }
    };

    const host = hostRef.current;
    host.innerHTML = "";

    const markFailed = () => {
      host.innerHTML = "";
      setWidgetReady(false);
      setFailed(true);
      onAvailabilityChange?.(false);
    };

    const inspect = () => {
      if (hasTelegramLoginWidget(host)) {
        setWidgetReady(true);
        setFailed(false);
        onAvailabilityChange?.(true);
        return;
      }
      if (readTelegramWidgetError(host)) {
        if (isDevEnvironment()) {
          onError?.(
            "Telegram Login Widget: register this site with BotFather (/setdomain) if sign-in fails here."
          );
        }
        markFailed();
      }
    };

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.setAttribute("data-telegram-login", username);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-radius", "8");
    script.setAttribute("data-onauth", "onShelfTelegramAuth(user)");
    script.setAttribute("data-request-access", "write");
    script.addEventListener("load", () => window.setTimeout(inspect, 300));
    host.appendChild(script);

    const observer = new MutationObserver(() => window.setTimeout(inspect, 50));
    observer.observe(host, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    const timer = window.setTimeout(inspect, 2000);

    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
      delete window.onShelfTelegramAuth;
      host.innerHTML = "";
    };
  }, [username, loginWithTelegram, onAvailabilityChange, onError, redirectTo, router]);

  if (probeOnly) {
    if (!username || !isTelegramLoginHostAllowed()) return null;
    return (
      <div
        ref={hostRef}
        aria-hidden
        className="fixed -left-[9999px] top-0 h-px w-px overflow-hidden opacity-0 pointer-events-none"
      />
    );
  }

  if (!username || !isTelegramLoginHostAllowed()) {
    if (!isDevEnvironment()) return null;
    return (
      <p className="text-xs text-center text-[var(--text-muted)]">
        Set{" "}
        <code className="text-[var(--accent)]">
          NEXT_PUBLIC_TELEGRAM_BOT_USERNAME
        </code>
      </p>
    );
  }

  if (failed && !isDevEnvironment()) return null;

  return (
    <div className="w-full space-y-2">
      {loading ? (
        <div className="w-full py-2.5 text-center text-sm text-[var(--text-muted)]">
          Signing in with Telegram...
        </div>
      ) : (
        <div
          ref={hostRef}
          aria-hidden={!widgetReady && !isDevEnvironment()}
          className={clsx(
            "flex justify-center w-full overflow-hidden",
            widgetReady || isDevEnvironment()
              ? "min-h-[40px]"
              : "absolute w-px h-px opacity-0 pointer-events-none overflow-hidden"
          )}
        />
      )}
    </div>
  );
}
