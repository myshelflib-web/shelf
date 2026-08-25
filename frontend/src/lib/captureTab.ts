export async function captureCurrentTab(): Promise<HTMLCanvasElement> {
  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: true,
    audio: false,
    preferCurrentTab: true,
    selfBrowserSurface: "include",
    surfaceSwitching: "exclude",
  } as MediaStreamConstraints);
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.srcObject = stream;
  try {
    await video.play();
    await new Promise((r) => window.setTimeout(r, 200));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, video.videoWidth);
    canvas.height = Math.max(1, video.videoHeight);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not capture this tab.");
    ctx.drawImage(video, 0, 0);
    return canvas;
  } finally {
    stream.getTracks().forEach((track) => track.stop());
    video.srcObject = null;
  }
}

export function cropElementFromTabCapture(
  tab: HTMLCanvasElement,
  el: HTMLElement
) {
  const rect = el.getBoundingClientRect();
  const scaleX = tab.width / window.innerWidth;
  const scaleY = tab.height / window.innerHeight;
  const sx = Math.max(0, rect.left * scaleX);
  const sy = Math.max(0, rect.top * scaleY);
  const sw = Math.max(1, rect.width * scaleX);
  const sh = Math.max(1, rect.height * scaleY);
  const crop = document.createElement("canvas");
  crop.width = Math.round(sw);
  crop.height = Math.round(sh);
  const ctx = crop.getContext("2d");
  if (!ctx) return "";
  ctx.drawImage(tab, sx, sy, sw, sh, 0, 0, crop.width, crop.height);
  return crop.toDataURL("image/png");
}

/** Snapshot a viewport rectangle (after hiding selection chrome). */
export async function captureViewportRect(box: {
  left: number;
  top: number;
  width: number;
  height: number;
}): Promise<string> {
  const html2canvas = (await import("html2canvas")).default;
  const left = Math.max(0, box.left);
  const top = Math.max(0, box.top);
  const width = Math.max(1, Math.min(box.width, window.innerWidth - left));
  const height = Math.max(1, Math.min(box.height, window.innerHeight - top));
  const canvas = await html2canvas(document.documentElement, {
    x: left,
    y: top,
    width,
    height,
    useCORS: true,
    logging: false,
    backgroundColor:
      getComputedStyle(document.body).backgroundColor || "#ffffff",
    scale: Math.min(2, window.devicePixelRatio || 1),
    ignoreElements: (el) => {
      if (!(el instanceof HTMLElement)) return false;
      return Boolean(
        el.dataset.clipChrome || el.classList.contains("clip-select-rect")
      );
    },
  });
  if (canvas.width < 2 || canvas.height < 2) return "";
  return canvas.toDataURL("image/png");
}
