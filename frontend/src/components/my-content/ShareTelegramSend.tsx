"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, ExternalLink, Send } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { telegramShareLinkUrl } from "@/lib/telegramShare";
import { toUserFacingError } from "@/lib/userFacingError";

type TelegramStatus = {
  configured: boolean;
  linked: boolean;
};

type Props = {
  pageId: string;
  pageTitle: string;
  linkPath: string | null;
};

export function ShareTelegramSend({ pageId, pageTitle, linkPath }: Props) {
  const { user, refreshUser } = useAuth();
  const [status, setStatus] = useState<TelegramStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<"document" | "message" | null>(null);

  const load = useCallback(async () => {
    try {
      const next = await api.telegram.status();
      setStatus({ configured: next.configured, linked: next.linked });
    } catch {
      setStatus(null);
    }
  }, []);

  useEffect(() => {
    setSent(null);
    setError(null);
    void load();
  }, [pageId, load]);

  const linked = status?.linked ?? user?.telegramLinked ?? false;
  const configured = status?.configured ?? true;

  const connect = async () => {
    setError(null);
    setBusy(true);
    try {
      const { url } = await api.telegram.link();
      window.open(url, "_blank", "noopener,noreferrer");
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
  };

  const send = async () => {
    setError(null);
    setSent(null);
    setBusy(true);
    try {
      const result = await api.telegram.sharePage(pageId);
      setSent(result.kind);
    } catch (err) {
      setError(
        toUserFacingError(
          err instanceof Error ? err.message : "Could not send to Telegram"
        )
      );
    } finally {
      setBusy(false);
    }
  };

  const fullUrl =
    typeof window !== "undefined" && linkPath
      ? `${window.location.origin}${linkPath}`
      : null;

  if (status && !status.configured) return null;

  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide font-semibold text-[var(--text-muted)] mb-2">
        Telegram
      </p>
      <div className="flex items-start gap-2.5">
        <span className="w-9 h-9 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--text-muted)] shrink-0">
          <Send className="w-4 h-4" />
        </span>
        <div className="min-w-0 flex-1 space-y-2">
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">
              Send to your Telegram
            </p>
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
              PDFs arrive in the Shelf bot chat (max 50 MB). Forward from there
              to any group. Notebooks and docs send a Shelf link instead.
            </p>
          </div>
          {sent ? (
            <p className="text-[11px] text-[var(--accent)] flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 shrink-0" />
              {sent === "document"
                ? "Sent. Open the Shelf bot chat in Telegram."
                : "Sent a Shelf link to the bot chat."}
            </p>
          ) : null}
          {error ? (
            <p className="text-[11px] text-red-400" role="alert">
              {error}
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            {configured && linked ? (
              <button
                type="button"
                className="h-8 px-3 rounded-lg bg-[var(--accent)] text-white text-xs font-semibold disabled:opacity-50"
                disabled={busy}
                onClick={() => void send()}
              >
                {busy ? "Sending…" : "Send to Telegram"}
              </button>
            ) : configured ? (
              <button
                type="button"
                className="h-8 px-3 rounded-lg border border-[var(--border)] text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] disabled:opacity-50"
                disabled={busy}
                onClick={() => void connect()}
              >
                {busy ? "Opening…" : "Connect Telegram"}
              </button>
            ) : null}
            {fullUrl ? (
              <a
                href={telegramShareLinkUrl(fullUrl, pageTitle)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-8 items-center gap-1.5 px-3 rounded-lg border border-[var(--border)] text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
              >
                Share link in Telegram
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <p className="text-[11px] text-[var(--text-muted)]">
                Enable Anyone with link above to share a Shelf URL into any
                Telegram chat.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
