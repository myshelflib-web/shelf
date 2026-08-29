"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Share2, X } from "lucide-react";
import { StreakShareCardArt } from "@/components/study-share/StreakShareCardArt";
import { buildStreakShareData } from "@/lib/studyShare/buildStreakShareData";
import { captureElementToBlob } from "@/lib/studyShare/captureElement";
import {
  downloadShareCardBlob,
  nativeShareCardBlob,
  openTelegramShareCard,
  shareCardFilename,
  shareCardLandingUrl,
} from "@/lib/studyShare/exportShareCard";
import { SHARE_CARD, type ShareCardFormat } from "@/lib/studyShare/cardTheme";
import { getReadingStats } from "@/lib/readingStats";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { AnalyticsEvents, track } from "@/lib/analytics";

type StudyShareSheetProps = {
  open: boolean;
  onClose: () => void;
};

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start justify-between gap-3 cursor-pointer py-2">
      <span>
        <span className="block text-[13px] font-medium">{label}</span>
        <span className="block text-[11px] text-[var(--text-muted)] mt-0.5">{hint}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 accent-[var(--accent)]"
      />
    </label>
  );
}

export function StudyShareSheet({ open, onClose }: StudyShareSheetProps) {
  const { user } = useAuth();
  const captureRef = useRef<HTMLDivElement>(null);
  const [format, setFormat] = useState<ShareCardFormat>("story");
  const [showStudyGoal, setShowStudyGoal] = useState(true);
  const [showTodayMinutes, setShowTodayMinutes] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [affiliateCode, setAffiliateCode] = useState<string | null>(null);

  const data = buildStreakShareData(getReadingStats(), user?.studyGoal);

  useEffect(() => {
    if (!open) return;
    setError("");
    void api.affiliate
      .me()
      .then((res) => setAffiliateCode(res.code))
      .catch(() => setAffiliateCode(null));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const capture = useCallback(async () => {
    const el = captureRef.current;
    if (!el) throw new Error("Card not ready");
    return captureElementToBlob(el, { scale: 2, backgroundColor: SHARE_CARD.bg });
  }, []);

  const shareText = `${data.streak}-day study streak · tracked on Shelf`;

  const runShare = useCallback(
    async (mode: "native" | "download" | "telegram") => {
      if (data.streak < 1) {
        setError("Read for a few minutes to start a streak, then share.");
        return;
      }
      setBusy(true);
      setError("");
      try {
        const blob = await capture();
        const filename = shareCardFilename(data.streak);
        const landing = shareCardLandingUrl(affiliateCode);

        if (mode === "download") {
          await downloadShareCardBlob(blob, filename);
          return;
        }
        if (mode === "telegram") {
          await downloadShareCardBlob(blob, filename);
          openTelegramShareCard(landing, data.streak, data.todayLabel);
          return;
        }
        const shared = await nativeShareCardBlob(blob, {
          title: "My Shelf study streak",
          text: shareText,
          filename,
        });
        if (!shared) await downloadShareCardBlob(blob, filename);
        track(AnalyticsEvents.shareStreakExported, {
          mode,
          format,
          streakDays: data.streak,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not share card");
      } finally {
        setBusy(false);
      }
    },
    [affiliateCode, capture, data.streak, data.todayLabel, format, shareText]
  );

  if (!open) return null;

  const previewScale = format === "story" ? 0.36 : 0.52;
  const previewW = SHARE_CARD.width * previewScale;
  const previewH =
    (format === "story" ? SHARE_CARD.storyHeight : SHARE_CARD.squareSize) *
    previewScale;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="study-share-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative w-full sm:max-w-md max-h-[92dvh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-elevated)]">
          <div>
            <h2 id="study-share-title" className="text-[15px] font-semibold">
              Share your streak
            </h2>
            <p className="text-[12px] text-[var(--text-muted)]">
              Story-ready card for Instagram, WhatsApp, Telegram
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 py-4 space-y-4">
          <div className="flex justify-center">
            <div
              className="rounded-xl overflow-hidden border border-[var(--border)] shadow-lg"
              style={{ width: previewW, height: previewH }}
            >
              <div
                style={{
                  transform: `scale(${previewScale})`,
                  transformOrigin: "top left",
                  width: SHARE_CARD.width,
                }}
              >
                <StreakShareCardArt
                  data={data}
                  format={format}
                  showStudyGoal={showStudyGoal}
                  showTodayMinutes={showTodayMinutes}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {(["story", "square"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFormat(f)}
                className={`flex-1 py-2 text-[13px] font-medium rounded-lg border ${
                  format === f
                    ? "border-[var(--accent)] bg-[var(--accent-light)] text-[var(--accent)]"
                    : "border-[var(--border)] text-[var(--text-secondary)]"
                }`}
              >
                {f === "story" ? "Story" : "Square"}
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] px-3 divide-y divide-[var(--border)]">
            <ToggleRow
              label="Show study goal"
              hint="UPSC, NEET PG, etc."
              checked={showStudyGoal}
              onChange={setShowStudyGoal}
            />
            <ToggleRow
              label="Show today's reading"
              hint="Minutes read today"
              checked={showTodayMinutes}
              onChange={setShowTodayMinutes}
            />
          </div>

          {error ? <p className="text-sm text-red-500">{error}</p> : null}

          <div className="grid grid-cols-1 gap-2 pb-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void runShare("native")}
              className="btn-primary w-full inline-flex items-center justify-center gap-2"
            >
              <Share2 className="w-4 h-4" />
              {busy ? "Preparing…" : "Share image"}
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => void runShare("download")}
                className="btn-secondary inline-flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Save PNG
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void runShare("telegram")}
                className="btn-secondary"
              >
                Telegram + link
              </button>
            </div>
          </div>
        </div>

        <div aria-hidden className="fixed pointer-events-none opacity-0 -left-[9999px] top-0">
          <StreakShareCardArt
            ref={captureRef}
            data={data}
            format={format}
            showStudyGoal={showStudyGoal}
            showTodayMinutes={showTodayMinutes}
          />
        </div>
      </div>
    </div>
  );
}
