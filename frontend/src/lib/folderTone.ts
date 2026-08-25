/** Quiet folder accents — desaturated, Linear-like. */
export const FOLDER_TONES = [
  { fg: "#7d8a7a", bg: "rgba(125, 138, 122, 0.12)" },
  { fg: "#7a8699", bg: "rgba(122, 134, 153, 0.12)" },
  { fg: "#9a8b76", bg: "rgba(154, 139, 118, 0.12)" },
  { fg: "#947c86", bg: "rgba(148, 124, 134, 0.12)" },
  { fg: "#738a88", bg: "rgba(115, 138, 136, 0.12)" },
  { fg: "#8580a0", bg: "rgba(133, 128, 160, 0.12)" },
] as const;

export function folderTone(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return FOLDER_TONES[Math.abs(h) % FOLDER_TONES.length];
}
