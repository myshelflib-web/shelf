"use client";

/** Capacitor detection + thin native helpers. Safe to import on web. */

export function isNativeCapacitor(): boolean {
  if (typeof window === "undefined") return false;
  const cap = (
    window as Window & {
      Capacitor?: { isNativePlatform?: () => boolean };
    }
  ).Capacitor;
  const native = Boolean(cap?.isNativePlatform?.());
  // Sync flag for CSS / early chrome before React effects run.
  if (native) {
    document.documentElement.dataset.shelfNative = "";
  }
  return native;
}

export async function hapticLight(): Promise<void> {
  if (!isNativeCapacitor()) return;
  try {
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    /* plugin unavailable in browser */
  }
}

export async function hapticMedium(): Promise<void> {
  if (!isNativeCapacitor()) return;
  try {
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch {
    /* ignore */
  }
}

export async function shareNative(opts: {
  title?: string;
  text?: string;
  url?: string;
  dialogTitle?: string;
}): Promise<boolean> {
  if (!isNativeCapacitor()) return false;
  try {
    const { Share } = await import("@capacitor/share");
    await Share.share(opts);
    return true;
  } catch {
    return false;
  }
}
