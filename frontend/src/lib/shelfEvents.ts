export const SHELF_QUIZ_STARTED = "shelf:quiz-started";
export const SHELF_FOCUS_NOTEBOOK = "shelf:focus-notebook";
export const SHELF_QUIZ_TAKING_ATTR = "shelfQuizTaking";

export function emitQuizStarted() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(SHELF_QUIZ_STARTED));
}

export function isQuizTaking(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.dataset[SHELF_QUIZ_TAKING_ATTR] !== undefined;
}

export type FocusNotebookDetail = {
  id: string | null;
  name: string | null;
};

export function emitFocusNotebook(detail: FocusNotebookDetail) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<FocusNotebookDetail>(SHELF_FOCUS_NOTEBOOK, { detail })
  );
}
