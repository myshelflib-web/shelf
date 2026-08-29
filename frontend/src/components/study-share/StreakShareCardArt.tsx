"use client";

import { forwardRef } from "react";
import { SHARE_CARD, type ShareCardFormat } from "@/lib/studyShare/cardTheme";
import { LAST7_LABELS } from "@/lib/studyShare/last7Days";
import type { StreakShareCardData } from "@/lib/studyShare/buildStreakShareData";

export type StreakShareCardArtProps = {
  data: StreakShareCardData;
  format: ShareCardFormat;
  showStudyGoal: boolean;
  showTodayMinutes: boolean;
};

function WeekStrip({ activity }: { activity: boolean[] }) {
  return (
    <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
      {activity.map((on, i) => (
        <div
          key={`${LAST7_LABELS[i]}-${i}`}
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.04em",
              color: SHARE_CARD.textMuted,
            }}
          >
            {LAST7_LABELS[i]}
          </span>
          <span
            style={{
              width: 28,
              height: 28,
              borderRadius: 999,
              background: on ? SHARE_CARD.accent : SHARE_CARD.bgSecondary,
              boxShadow: on ? `0 0 18px ${SHARE_CARD.accentGlow}` : "none",
              border: `1px solid ${on ? SHARE_CARD.accent : SHARE_CARD.border}`,
            }}
          />
        </div>
      ))}
    </div>
  );
}

function ShelfMark() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          background: SHARE_CARD.accent,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontSize: 15,
          fontWeight: 700,
        }}
      >
        S
      </span>
      <span
        style={{
          fontSize: 18,
          fontWeight: 600,
          letterSpacing: "-0.03em",
          color: SHARE_CARD.textPrimary,
        }}
      >
        Shelf
      </span>
    </div>
  );
}

function StreakHero({ streak }: { streak: number }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          width: 88,
          height: 88,
          margin: "0 auto 18px",
          borderRadius: 999,
          background: `radial-gradient(circle at 30% 30%, ${SHARE_CARD.flameGlow}, transparent 70%)`,
          border: `1px solid ${SHARE_CARD.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 40,
          lineHeight: 1,
        }}
      >
        🔥
      </div>
      <div
        style={{
          fontSize: 96,
          fontWeight: 700,
          letterSpacing: "-0.05em",
          lineHeight: 0.95,
          color: SHARE_CARD.textPrimary,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {streak}
      </div>
      <div
        style={{
          marginTop: 10,
          fontSize: 22,
          fontWeight: 600,
          color: SHARE_CARD.flame,
          letterSpacing: "-0.02em",
        }}
      >
        {streak === 1 ? "day streak" : "day streak"}
      </div>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        flex: 1,
        padding: "14px 16px",
        borderRadius: 12,
        background: SHARE_CARD.bgElevated,
        border: `1px solid ${SHARE_CARD.border}`,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: SHARE_CARD.textMuted,
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 20,
          fontWeight: 600,
          color: SHARE_CARD.textPrimary,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </div>
    </div>
  );
}

export const StreakShareCardArt = forwardRef<HTMLDivElement, StreakShareCardArtProps>(
  function StreakShareCardArt(
    { data, format, showStudyGoal, showTodayMinutes },
    ref
  ) {
    const isStory = format === "story";
    const height = isStory ? SHARE_CARD.storyHeight : SHARE_CARD.squareSize;

    return (
      <div
        ref={ref}
        style={{
          width: SHARE_CARD.width,
          height,
          boxSizing: "border-box",
          fontFamily: SHARE_CARD.font,
          background: `
            radial-gradient(ellipse 120% 80% at 50% -10%, ${SHARE_CARD.accentGlow}, transparent 55%),
            radial-gradient(circle at 85% 90%, ${SHARE_CARD.flameGlow}, transparent 45%),
            ${SHARE_CARD.bg}
          `,
          color: SHARE_CARD.textPrimary,
          padding: isStory ? "36px 32px 28px" : "28px 24px",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <ShelfMark />
          {showStudyGoal && data.studyGoalLabel ? (
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: "6px 12px",
                borderRadius: 999,
                background: SHARE_CARD.bgElevated,
                border: `1px solid ${SHARE_CARD.border}`,
                color: SHARE_CARD.textSecondary,
              }}
            >
              {data.studyGoalLabel}
            </span>
          ) : null}
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: isStory ? 28 : 16,
            padding: isStory ? "12px 0 20px" : "8px 0",
          }}
        >
          <StreakHero streak={data.streak} />

          {data.latestMedal ? (
            <div
              style={{
                margin: "0 auto",
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 16px",
                borderRadius: 999,
                background: SHARE_CARD.bgElevated,
                border: `1px solid ${SHARE_CARD.border}`,
              }}
            >
              <span style={{ fontSize: 18 }}>{data.latestMedal.emoji}</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: data.latestMedal.color }}>
                {data.latestMedal.label}
              </span>
            </div>
          ) : null}

          <WeekStrip activity={data.weekActivity} />

          <div style={{ display: "flex", gap: 10 }}>
            {showTodayMinutes ? (
              <StatPill label="Today" value={data.todayLabel} />
            ) : null}
            <StatPill
              label="Active days"
              value={String(data.activeDays)}
            />
          </div>
        </div>

        <div
          style={{
            borderTop: `1px solid ${SHARE_CARD.border}`,
            paddingTop: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 13, color: SHARE_CARD.textMuted }}>
            Private study library
          </span>
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: SHARE_CARD.accent,
              letterSpacing: "-0.01em",
            }}
          >
            myshelflib.com
          </span>
        </div>
      </div>
    );
  }
);
