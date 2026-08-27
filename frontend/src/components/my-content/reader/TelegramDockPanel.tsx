"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, ExternalLink, Link2, Unlink, X } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { isDevEnvironment, toUserFacingError } from "@/lib/userFacingError";

/** Full-bleed circular mark — same optical fill as Spotify (viewBox 0–24). */
function TelegramMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      className={className}
      aria-hidden
      fill="currentColor"
    >
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.14.18-.357.295-.6.295-.002 0-.01 0-.01-.002l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.12L6.85 13.56l-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z" />
    </svg>
  );
}

type TelegramStatus = {
  configured: boolean;
  botUsername: string | null;
  linked: boolean;
  telegramUsername: string | null;
};

export function TelegramDockPanel({
  minimized = false,
  onMinimize,
}: {
  minimized?: boolean;
  onMinimize: () => void;
  onExpand?: () => void;
}) {
  const { user, refreshUser } = useAuth();
  const [status, setStatus] = useState<TelegramStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [hint, setHint] = useState("");
  const autoConnectTried = useRef(false);

  const load = useCallback(async () => {
    try {
      const next = await api.telegram.status();
      setStatus(next);
      return next;
    } catch (err) {
      setError(
        toUserFacingError(
          err instanceof Error ? err.message : "Could not load Telegram"
        )
      );
      return null;
    }
  }, []);

  const connect = useCallback(async () => {
    setError("");
    setHint("");
    setBusy(true);
    try {
      const { url } = await api.telegram.link();
      window.open(url, "_blank", "noopener,noreferrer");
      setHint(
        "In Telegram, tap Start to finish. Works for Google, email, or any Shelf account."
      );
      window.setTimeout(() => {
        void refreshUser().catch(() => undefined);
        void load();
      }, 3000);
    } catch (err) {
      setError(
        toUserFacingError(
          err instanceof Error ? err.message : "Could not start linking"
        )
      );
    } finally {
      setBusy(false);
    }
  }, [load, refreshUser]);

  useEffect(() => {
    if (minimized) {
      autoConnectTried.current = false;
      return;
    }
    void load();
  }, [minimized, load]);

  // Opening the dock while unlinked starts Connect (same path for Google users).
  useEffect(() => {
    if (minimized || !status || autoConnectTried.current) return;
    if (!status.configured || status.linked) return;
    autoConnectTried.current = true;
    void connect();
  }, [minimized, status, connect]);

  const linked = status?.linked ?? user?.telegramLinked ?? false;
  const tgName =
    status?.telegramUsername ?? user?.telegramUsername ?? null;
  const botUser = status?.botUsername;
  const botUrl = botUser ? `https://t.me/${botUser}` : null;

  const disconnect = async () => {
    setError("");
    setHint("");
    setBusy(true);
    try {
      await api.telegram.unlink();
      await refreshUser();
      await load();
      setHint("Telegram disconnected. PDFs already in My Content stay put.");
    } catch (err) {
      setError(
        toUserFacingError(
          err instanceof Error ? err.message : "Could not unlink"
        )
      );
    } finally {
      setBusy(false);
    }
  };

  if (minimized) return null;

  return (
    <div className="h-full flex flex-col border-l border-[var(--border)] bg-[var(--bg-elevated)] overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 pt-3 pb-2 shrink-0 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--accent-subtle)] text-[var(--accent)] shrink-0">
            <TelegramMark className="w-3.5 h-3.5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-[13px] font-semibold text-[var(--text-primary)] leading-tight">
              Telegram
            </h2>
            <p className="text-[11px] text-[var(--text-muted)] truncate">
              {linked
                ? tgName
                  ? `Connected as @${tgName}`
                  : "Connected to Telegram"
                : "Connect any Shelf account · save PDFs from chats"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onMinimize}
          className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
          title="Hide Telegram panel"
          aria-label="Hide Telegram panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
        {error ? <p className="text-[11px] text-red-400">{error}</p> : null}
        {hint ? (
          <p className="text-[11px] text-[var(--accent)] leading-relaxed">{hint}</p>
        ) : null}

        {!status ? (
          <p className="text-[12px] text-[var(--text-muted)]">Loading…</p>
        ) : !status.configured ? (
          <div className="rounded-[10px] border border-dashed border-[var(--border)] px-4 py-8 text-center">
            <TelegramMark className="w-8 h-8 mx-auto mb-2 text-[var(--text-muted)]" />
            <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
              {isDevEnvironment()
                ? "Telegram is not configured yet. Add bot env vars on the API, then reopen this panel."
                : "Telegram isn’t available right now."}
            </p>
          </div>
        ) : linked ? (
          <>
            <div className="rounded-[10px] border border-[var(--border)] bg-[var(--bg-primary)] px-3 py-3 space-y-2">
              <p className="text-[12px] font-medium text-[var(--text-primary)] flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                Connected to Telegram
                {tgName ? (
                  <span className="text-[var(--text-muted)] font-normal truncate">
                    @{tgName}
                  </span>
                ) : null}
              </p>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                Forward or send a PDF to the Shelf bot. It lands in My Content
                (library root). Max ~20 MB via the bot.
              </p>
            </div>

            <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-[var(--text-secondary)] leading-relaxed">
              <li>Open a chat where someone shared a PDF</li>
              <li>Forward the file to the Shelf bot</li>
              <li>Open the bot’s link — or refresh My Content</li>
            </ol>

            <div className="flex flex-col gap-2">
              {botUrl ? (
                <a
                  href={botUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 w-full rounded-lg bg-[var(--accent-subtle)] hover:opacity-90 border border-[var(--border)] px-3 py-2 text-[12px] font-medium text-[var(--accent)] transition-colors"
                >
                  Open Shelf bot
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : null}
              <button
                type="button"
                onClick={disconnect}
                disabled={busy}
                className="btn-secondary inline-flex items-center justify-center gap-1.5 w-full px-3 py-2 text-[12px] disabled:opacity-50"
              >
                <Unlink className="w-3.5 h-3.5" />
                {busy ? "Working…" : "Disconnect"}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-[11px] leading-relaxed text-[var(--text-muted)]">
              Signed in with Google or email? Connect still works — we link
              Telegram to this Shelf account so forwarded PDFs land in your
              library.
            </p>

            <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-[var(--text-secondary)] leading-relaxed">
              <li>Telegram should open with Start on the Shelf bot</li>
              <li>Tap Start to finish linking</li>
              <li>Return here — status updates to Connected</li>
            </ol>

            <button
              type="button"
              onClick={() => void connect()}
              disabled={busy}
              className="inline-flex items-center justify-center gap-1.5 w-full rounded-lg bg-[var(--accent)] hover:bg-[var(--accent-hover)] px-3 py-2 text-[12px] font-medium text-white transition-colors disabled:opacity-50"
            >
              <Link2 className="w-3.5 h-3.5" />
              {busy ? "Opening Telegram…" : "Connect Telegram"}
            </button>

            <button
              type="button"
              onClick={() => {
                void load();
                void refreshUser().catch(() => undefined);
              }}
              className="w-full text-center text-[11px] text-[var(--accent)] hover:underline"
            >
              I already tapped Start — refresh status
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/** Same footprint as SpotifyToolbarIcon (`size-4` / 16×16). */
export function TelegramToolbarIcon({
  linked,
  className,
}: {
  linked?: boolean;
  className?: string;
}) {
  return (
    <span className="relative inline-flex size-4 shrink-0 items-center justify-center leading-none align-middle">
      <TelegramMark
        className={className ?? "block size-4 shrink-0"}
      />
      {linked ? (
        <span
          className="pointer-events-none absolute -right-px -top-px size-1.5 rounded-full bg-[var(--accent)] ring-1 ring-[var(--bg-elevated)]"
          aria-hidden
        />
      ) : null}
    </span>
  );
}
