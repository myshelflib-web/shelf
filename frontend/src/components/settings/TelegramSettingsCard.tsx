"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { isDevEnvironment, toUserFacingError } from "@/lib/userFacingError";

export function TelegramSettingsCard() {
  const { user, refreshUser } = useAuth();
  const [status, setStatus] = useState<{
    configured: boolean;
    botUsername: string | null;
    linked: boolean;
    telegramUsername: string | null;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = () => {
    api.telegram
      .status()
      .then(setStatus)
      .catch((err) =>
        setError(
          toUserFacingError(
            err instanceof Error ? err.message : "Could not load Telegram"
          )
        )
      );
  };

  useEffect(() => {
    load();
  }, []);

  const connect = async () => {
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const { url } = await api.telegram.link();
      window.open(url, "_blank", "noopener,noreferrer");
      setMessage(
        "Finish linking in Telegram, then refresh this page if status does not update."
      );
      // Revalidate in background after a short delay (non-blocking).
      window.setTimeout(() => {
        void refreshUser().catch(() => undefined);
        load();
      }, 2500);
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

  const disconnect = async () => {
    setError("");
    setMessage("");
    setBusy(true);
    try {
      await api.telegram.unlink();
      await refreshUser();
      load();
      setMessage("Telegram disconnected.");
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

  const linked = status?.linked ?? user?.telegramLinked ?? false;
  const tgName =
    status?.telegramUsername ?? user?.telegramUsername ?? null;

  if (status && !status.configured && !isDevEnvironment()) {
    return null;
  }

  return (
    <section className="p-5 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] space-y-3">
      <h2 className="text-sm font-semibold">Telegram</h2>
      <p className="text-xs text-[var(--text-muted)]">
        Works with Google, email, or Telegram login. Connect the bot to forward
        PDFs into My Content (library root, PDFs only, max 20 MB via the bot).
        Send a library PDF back from Share on the document (bot chat, max 50
        MB). You can also connect from the Telegram icon beside Spotify in the
        reader.
      </p>
      {error && <p className="text-sm text-red-500">{error}</p>}
      {message && (
        <p className="text-sm text-[var(--accent)]">{message}</p>
      )}
      {!status ? (
        <p className="text-sm text-[var(--text-muted)]">Loading…</p>
      ) : !status.configured ? (
        <p className="text-sm text-[var(--text-muted)]">
          Telegram is not configured on this server yet.
        </p>
      ) : linked ? (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm">
            Linked
            {tgName ? (
              <>
                {" "}
                as <span className="font-medium">@{tgName}</span>
              </>
            ) : null}
          </p>
          <button
            type="button"
            onClick={disconnect}
            disabled={busy}
            className="btn-secondary text-sm px-3 py-1.5 disabled:opacity-50"
          >
            {busy ? "Working…" : "Disconnect"}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={connect}
          disabled={busy}
          className="btn-secondary text-sm px-3 py-1.5 disabled:opacity-50"
        >
          {busy ? "Opening…" : "Connect Telegram"}
        </button>
      )}
    </section>
  );
}
