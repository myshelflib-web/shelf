import { isBlankCanvasHtml } from "./blankCanvas";
import { isDocEditorHtml } from "./docEditor";
import { isSketchNotebookHtml } from "./sketchNotebook";

/** Shelf-created live editors (autosave, no read/edit toggle). */
export function isLiveEditorHtml(html: string): boolean {
  return (
    isBlankCanvasHtml(html) ||
    isSketchNotebookHtml(html) ||
    isDocEditorHtml(html)
  );
}

export type BlankCreateKind = "sketch" | "doc";
