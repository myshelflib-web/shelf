"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, ExternalLink, Link2, Unlink, X } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

function TelegramMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06-.01.24 0 .38z" />
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

  const load = useCallback(() => {
    api.telegram
      .status()
      .then(setStatus)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Could not load Telegram")
      );
  }, []);

  useEffect(() => {
    if (minimized) return;
    load();
  }, [minimized, load]);

  const linked = status?.linked ?? user?.telegramLinked ?? false;
  const tgName =
    status?.telegramUsername ?? user?.telegramUsername ?? null;
  const botUser = status?.botUsername;
  const botUrl = botUser ? `https://t.me/${botUser}` : null;

  const connect = async () => {
    setError("");
    setHint("");
    setBusy(true);
    try {
      const { url } = await api.telegram.link();
      window.open(url, "_blank", "noopener,noreferrer");
      setHint(
        "Tap Start in Telegram to finish linking. This panel will refresh in a few seconds."
      );
      window.setTimeout(() => {
        void refreshUser().catch(() => undefined);
        load();
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start linking");
    } finally {
      setBusy(false);
    }
  };

  const disconnect = async () => {
    setError("");
    setHint("");
    setBusy(true);
    try {
      await api.telegram.unlink();
      await refreshUser();
      load();
      setHint("Telegram disconnected. PDFs already in My Content stay put.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not unlink");
    } finally {
      setBusy(false);
    }
  };

  if (minimized) return null;

  return (
    <div className="h-full flex flex-col border-l border-[var(--border)] bg-[var(--bg-elevated)] overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 pt-3 pb-2 shrink-0 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#2AABEE]/15 text-[#2AABEE] shrink-0">
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
                : "Connect to save PDFs from chats"}
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
          <div className="rounded-xl border border-dashed border-[var(--border)] px-4 py-6 text-center space-y-2">
            <TelegramMark className="w-8 h-8 mx-auto text-[#2AABEE]/70" />
            <p className="text-[12px] text-[var(--text-muted)] leading-relaxed">
              Telegram is not configured on this server yet. Ask your admin to
              set the bot token, or use Settings once it is live.
            </p>
          </div>
        ) : linked ? (
          <>
            <div className="rounded-xl border border-[#2AABEE]/30 bg-[#2AABEE]/10 px-3 py-3 space-y-2">
              <p className="text-[12px] font-medium text-[var(--text-primary)] flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#2AABEE]" />
                Connected to Telegram
                {tgName ? (
                  <span className="text-[var(--text-muted)] font-normal">
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
              <li>Open the link the bot replies with — or refresh My Content</li>
            </ol>

            <div className="flex flex-col gap-2">
              {botUrl ? (
                <a
                  href={botUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 w-full rounded-lg bg-[#2AABEE]/15 hover:bg-[#2AABEE]/25 border border-[#2AABEE]/30 px-3 py-2 text-[12px] font-medium text-[#2AABEE] transition-colors"
                >
                  Open Shelf bot
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : null}
              <button
                type="button"
                onClick={disconnect}
                disabled={busy}
                className="inline-flex items-center justify-center gap-1.5 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-[12px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] disabled:opacity-50"
              >
                <Unlink className="w-3.5 h-3.5" />
                {busy ? "Working…" : "Disconnect"}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-[11px] leading-relaxed text-[var(--text-muted)]">
              Link Telegram to forward study PDFs from groups into Shelf. You
              can also sign in with Telegram on the login page — that links
              automatically.
            </p>

            <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-[var(--text-secondary)] leading-relaxed">
              <li>Tap Connect Telegram below</li>
              <li>In Telegram, press Start on the Shelf bot</li>
              <li>Come back here — status should show Connected</li>
            </ol>

            <button
              type="button"
              onClick={connect}
              disabled={busy}
              className="inline-flex items-center justify-center gap-1.5 w-full rounded-lg bg-[#2AABEE]/15 hover:bg-[#2AABEE]/25 border border-[#2AABEE]/30 px-3 py-2 text-[12px] font-medium text-[#2AABEE] transition-colors disabled:opacity-50"
            >
              <Link2 className="w-3.5 h-3.5" />
              {busy ? "Opening…" : "Connect Telegram"}
            </button>

            <button
              type="button"
              onClick={() => {
                load();
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

export function TelegramToolbarIcon({
  linked,
  className,
}: {
  linked?: boolean;
  className?: string;
}) {
  return (
    <span className="relative inline-flex">
      <TelegramMark className={className} />
      {linked ? (
        <span
          className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-[#2AABEE] ring-1 ring-[var(--bg-elevated)]"
          aria-hidden
        />
      ) : null}
    </span>
  );
}
