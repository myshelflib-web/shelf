/** Fixed palette for share cards — always dark, independent of app theme. */
export const SHARE_CARD = {
  width: 540,
  storyHeight: 960,
  squareSize: 540,
  bg: "#0c0c0d",
  bgElevated: "#19191b",
  bgSecondary: "#141415",
  border: "#242426",
  textPrimary: "#ececee",
  textSecondary: "#9b9ba0",
  textMuted: "#6e6e73",
  accent: "#6e79d6",
  accentGlow: "rgba(110, 121, 214, 0.35)",
  flame: "#c9a066",
  flameGlow: "rgba(201, 160, 102, 0.28)",
  font:
    'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
} as const;

export type ShareCardFormat = "story" | "square";
