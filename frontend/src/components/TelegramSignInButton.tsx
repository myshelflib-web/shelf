"use client";

import { useAuth } from "@/hooks/useAuth";
import { isDevEnvironment, toUserFacingError } from "@/lib/userFacingError";
import {
  hasTelegramLoginWidget,
  isTelegramLoginHostAllowed,
  readTelegramWidgetError,
} from "@/lib/telegramLoginWidget";
import { useRouter } from "next/navigation";
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
}: TelegramSignInButtonProps) {
  const { loginWithTelegram } = useAuth();
  const router = useRouter();
  const hostRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [hidden, setHidden] = useState(false);
  const username = botUsername();

  useEffect(() => {
    if (!username || !isTelegramLoginHostAllowed()) {
      onAvailabilityChange?.(false);
      return;
    }
    onAvailabilityChange?.(true);
  }, [onAvailabilityChange, username]);

  useEffect(() => {
    if (!username || !hostRef.current || !isTelegramLoginHostAllowed()) return;

    setHidden(false);

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
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.setAttribute("data-telegram-login", username);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-radius", "8");
    script.setAttribute("data-onauth", "onShelfTelegramAuth(user)");
    script.setAttribute("data-request-access", "write");

    const inspect = () => {
      if (hasTelegramLoginWidget(host)) {
        onAvailabilityChange?.(true);
        return;
      }
      const err = readTelegramWidgetError(host);
      if (!err) return;

      if (isDevEnvironment()) {
        onError?.(
          "Telegram Login Widget: register this site with BotFather (/setdomain) if sign-in fails here. The bot itself can still work for PDF forwarding."
        );
        return;
      }

      host.textContent = "";
      setHidden(true);
      onAvailabilityChange?.(false);
    };

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

  if (hidden && !isDevEnvironment()) return null;

  return (
    <div className="w-full space-y-2">
      {loading ? (
        <div className="w-full py-2.5 text-center text-sm text-[var(--text-muted)]">
          Signing in with Telegram...
        </div>
      ) : (
        <div ref={hostRef} className="flex justify-center w-full min-h-[40px]" />
      )}
    </div>
  );
}
