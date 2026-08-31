"use client";

import { useTelegramBotUsername } from "@/components/TelegramAuthProvider";
import { useAuth } from "@/hooks/useAuth";
import { useSocialSignInWidth } from "@/hooks/useSocialSignInWidth";
import { api } from "@/lib/api";
import {
  hasTelegramLoginWidget,
  normalizeTelegramBotUsername,
  readTelegramWidgetError,
} from "@/lib/telegramLoginWidget";
import { isDevEnvironment, toUserFacingError } from "@/lib/userFacingError";
import { useRouter } from "next/navigation";
import { useLayoutEffect, useEffect, useRef, useState } from "react";

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
  redirectTo?: string;
  /** Fired when the Telegram auth exchange with Shelf is in progress. */
  onSigningInChange?: (signingIn: boolean) => void;
}

declare global {
  interface Window {
    onShelfTelegramAuth?: (user: TelegramAuthUser) => void;
  }
}

function TelegramMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#2AABEE"
        d="M11.94 2C6.42 2 2 6.18 2 11.5S6.42 21 11.94 21c5.52 0 9.94-4.18 9.94-9.5S17.46 2 11.94 2zm4.58 6.45-1.57 7.4c-.12.53-.43.66-.87.41l-2.4-1.77-1.16 1.12c-.13.13-.24.24-.49.24l.17-2.43 4.43-4c.2-.17-.04-.27-.3-.1l-5.48 3.45-2.36-.74c-.51-.16-.52-.51.11-.75l9.22-3.55c.43-.16.8.1.66 1.12z"
      />
    </svg>
  );
}

export function TelegramSignInButton({
  onError,
  redirectTo = "/my-content",
  onSigningInChange,
}: TelegramSignInButtonProps) {
  const fromContext = useTelegramBotUsername();
  const { loginWithTelegram } = useAuth();
  const router = useRouter();
  const { ref: widthRef, width: containerWidth } = useSocialSignInWidth();
  const widgetHostRef = useRef<HTMLDivElement>(null);
  const onErrorRef = useRef(onError);
  const onSigningInChangeRef = useRef(onSigningInChange);
  const loginRef = useRef(loginWithTelegram);
  const redirectRef = useRef(redirectTo);
  const [fromApi, setFromApi] = useState<string | null>(null);
  const [fetchDone, setFetchDone] = useState(() => Boolean(fromContext));
  const [loading, setLoading] = useState(false);
  const [widgetReady, setWidgetReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [widgetScale, setWidgetScale] = useState(1);

  onErrorRef.current = onError;
  onSigningInChangeRef.current = onSigningInChange;
  loginRef.current = loginWithTelegram;
  redirectRef.current = redirectTo;

  const username = fromContext || fromApi;

  useEffect(() => {
    if (fromContext) {
      setFetchDone(true);
      return;
    }
    let cancelled = false;
    api.telegram
      .loginWidget()
      .then((res) => {
        if (!cancelled) {
          setFromApi(normalizeTelegramBotUsername(res.botUsername));
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setFetchDone(true);
      });
    return () => {
      cancelled = true;
    };
  }, [fromContext]);

  useLayoutEffect(() => {
    if (!username || !widgetHostRef.current) return;

    setFailed(false);
    setWidgetReady(false);

    window.onShelfTelegramAuth = async (user) => {
      setLoading(true);
      onSigningInChangeRef.current?.(true);
      try {
        await loginRef.current(user);
        router.push(redirectRef.current);
      } catch (err) {
        onSigningInChangeRef.current?.(false);
        onErrorRef.current?.(
          toUserFacingError(
            err instanceof Error ? err.message : "Telegram sign-in failed",
            "Telegram sign-in failed"
          )
        );
      } finally {
        setLoading(false);
      }
    };

    const host = widgetHostRef.current;
    host.innerHTML = "";

    const inspect = () => {
      if (hasTelegramLoginWidget(host)) {
        setWidgetReady(true);
        setFailed(false);
        return;
      }
      if (readTelegramWidgetError(host)) {
        host.innerHTML = "";
        setWidgetReady(false);
        setFailed(true);
        if (isDevEnvironment()) {
          onErrorRef.current?.(
            "Telegram Login Widget: register this site with BotFather (/setdomain) if sign-in fails here."
          );
        }
      }
    };

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.setAttribute("data-telegram-login", username);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-radius", "8");
    script.setAttribute("data-userpic", "false");
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
  }, [username, router]);

  useEffect(() => {
    if (!widgetReady || !widgetHostRef.current) return;
    const iframe = widgetHostRef.current.querySelector("iframe");
    const natural = iframe?.getBoundingClientRect().width;
    if (natural && natural > 0 && containerWidth > 0) {
      setWidgetScale(containerWidth / natural);
    }
  }, [widgetReady, containerWidth]);

  const onFallbackClick = () => {
    if (failed) {
      onError?.(
        "Telegram isn’t available right now. Please try again later."
      );
    }
  };

  if (!username) {
    if (!fetchDone || !isDevEnvironment()) return null;
    return (
      <p className="text-xs text-center text-[var(--text-muted)]">
        Set{" "}
        <code className="text-[var(--accent)]">TELEGRAM_BOT_USERNAME</code> on
        the frontend (same bot username as the API)
      </p>
    );
  }

  return (
    <div ref={widthRef} className="relative w-full h-10">
      {loading ? (
        <div className="w-full h-10 flex items-center justify-center text-sm text-[var(--text-muted)]">
          Signing in with Telegram...
        </div>
      ) : (
        <button
          type="button"
          onClick={onFallbackClick}
          className="w-full h-10 flex items-center justify-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-sm font-medium text-[var(--text-primary)]"
        >
          <TelegramMark className="w-5 h-5" />
          Continue with Telegram
        </button>
      )}
      <div
        ref={widgetHostRef}
        className="absolute left-0 top-0 z-10 h-10 origin-top-left overflow-hidden"
        style={{
          opacity: widgetReady && !loading ? 0.02 : 0,
          pointerEvents: widgetReady && !loading ? "auto" : "none",
          transform:
            widgetReady && widgetScale > 0 ? `scale(${widgetScale})` : undefined,
          width:
            widgetReady && widgetScale > 0
              ? containerWidth / widgetScale
              : "100%",
        }}
        aria-hidden
      />
    </div>
  );
}
