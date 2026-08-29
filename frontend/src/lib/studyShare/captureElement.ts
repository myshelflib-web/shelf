/** Rasterize a DOM node to PNG via html2canvas. */
export async function captureElementToBlob(
  el: HTMLElement,
  opts?: { scale?: number; backgroundColor?: string }
): Promise<Blob> {
  const html2canvas = (await import("html2canvas")).default;
  const scale = opts?.scale ?? 2;
  const canvas = await html2canvas(el, {
    scale,
    useCORS: true,
    logging: false,
    backgroundColor: opts?.backgroundColor ?? "#0c0c0d",
    width: el.offsetWidth,
    height: el.offsetHeight,
    windowWidth: el.offsetWidth,
    windowHeight: el.offsetHeight,
  });
  if (canvas.width < 2 || canvas.height < 2) {
    throw new Error("Share card capture failed");
  }
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Could not create image"))),
      "image/png",
      1
    );
  });
  return blob;
}
