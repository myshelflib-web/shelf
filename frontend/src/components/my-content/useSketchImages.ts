"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAppDialog } from "@/hooks/useAppDialog";
import {
  fileToEditorDataUrl,
  imageFileFromClipboard,
  newSketchImageId,
} from "@/lib/editorImages";
import {
  fitSketchImageSize,
  pointHitsSketchImage,
  type SketchImage,
} from "@/lib/sketchNotebook";
import type { BlankPt } from "@/lib/blankCanvas";

/** Paste / upload helpers + hit-test erase for sketch page images. */
export function useSketchImages(opts: {
  images: SketchImage[];
  onCommitImages: (next: SketchImage[]) => void;
  enabled: boolean;
}) {
  const { images, onCommitImages, enabled } = opts;
  const { alert } = useAppDialog();
  const [busy, setBusy] = useState(false);
  const imagesRef = useRef(images);
  imagesRef.current = images;
  const onCommitRef = useRef(onCommitImages);
  onCommitRef.current = onCommitImages;

  const insertFromFile = useCallback(
    async (file: File) => {
      if (busy) return;
      setBusy(true);
      try {
        const { dataUrl, width, height } = await fileToEditorDataUrl(file);
        const box = fitSketchImageSize(width, height);
        const next: SketchImage = {
          id: newSketchImageId(),
          src: dataUrl,
          ...box,
        };
        onCommitRef.current([...imagesRef.current, next]);
      } catch (e) {
        await alert({
          title: "Could not insert image",
          message: e instanceof Error ? e.message : "Try another file",
        });
      } finally {
        setBusy(false);
      }
    },
    [alert, busy]
  );

  useEffect(() => {
    if (!enabled) return;
    const onPaste = (e: ClipboardEvent) => {
      const file = imageFileFromClipboard(e.clipboardData);
      if (!file) return;
      const t = e.target as HTMLElement | null;
      if (t?.closest?.("input, textarea, [contenteditable=true]")) return;
      e.preventDefault();
      void insertFromFile(file);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [enabled, insertFromFile]);

  const eraseImageAt = useCallback((pt: BlankPt): boolean => {
    const hit = [...imagesRef.current]
      .reverse()
      .find((img) => pointHitsSketchImage(img, pt));
    if (!hit) return false;
    onCommitRef.current(imagesRef.current.filter((img) => img.id !== hit.id));
    return true;
  }, []);

  return { busy, insertFromFile, eraseImageAt };
}

export function pageImages(
  page: { images?: SketchImage[] } | undefined
): SketchImage[] {
  return page?.images ?? [];
}
