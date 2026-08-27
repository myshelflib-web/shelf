"use client";

import { useAuth } from "@/hooks/useAuth";
import { isDevEnvironment, toUserFacingError } from "@/lib/userFacingError";
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
  redirectTo?: string;
}

declare global {
  interface Window {
    onShelfTelegramAuth?: (user: TelegramAuthUser) => void;
  }
}

function TelegramIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#2AABEE"
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06-.01.24 0 .38z"
      />
    </svg>
  );
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
  redirectTo = "/my-content",
}: TelegramSignInButtonProps) {
  const { loginWithTelegram } = useAuth();
  const router = useRouter();
  const hostRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const username = botUsername();

  useEffect(() => {
    if (!username || !hostRef.current) return;

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
    host.appendChild(script);

    return () => {
      delete window.onShelfTelegramAuth;
      host.innerHTML = "";
    };
  }, [username, loginWithTelegram, onError, redirectTo, router]);

  if (!username) {
    if (!isDevEnvironment()) return null;
    return (
      <div className="space-y-2">
        <button
          type="button"
          disabled
          className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-lg border border-[var(--border)] bg-[var(--bg-primary)] text-[var(--text-muted)] cursor-not-allowed"
        >
          <TelegramIcon />
          <span className="text-sm font-medium">Continue with Telegram</span>
        </button>
        <p className="text-xs text-center text-[var(--text-muted)]">
          Set{" "}
          <code className="text-[var(--accent)]">
            NEXT_PUBLIC_TELEGRAM_BOT_USERNAME
          </code>{" "}
          (and backend{" "}
          <code className="text-[var(--accent)]">TELEGRAM_BOT_TOKEN</code>)
        </p>
      </div>
    );
  }

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
