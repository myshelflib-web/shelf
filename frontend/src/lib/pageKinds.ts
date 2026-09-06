import { isBlankCanvasHtml } from "./blankCanvas";
import { isLiveDocEditorHtml } from "./docEditor";
import { isSketchNotebookHtml } from "./sketchNotebook";

/** Shelf-created live editors (autosave, no read/edit toggle). */
export function isLiveEditorHtml(html: string): boolean {
  return (
    isBlankCanvasHtml(html) ||
    isSketchNotebookHtml(html) ||
    isLiveDocEditorHtml(html)
  );
}

export type BlankCreateKind = "sketch" | "doc";
