export type AnnotationGate = "sign-in" | "save-to-library";

export const PRELOADED_SAVE_PROMPT_EVENT = "shelf:preloaded-save-prompt";

export function resolveAnnotationLock(params: {
  signInGateActive: boolean;
  canAnnotate: boolean | undefined;
  isPreloaded: boolean;
}): { locked: boolean; gate: AnnotationGate | null } {
  if (params.signInGateActive) {
    return { locked: true, gate: "sign-in" };
  }
  if (params.canAnnotate === false) {
    return { locked: true, gate: "sign-in" };
  }
  if (params.isPreloaded) {
    return { locked: true, gate: "save-to-library" };
  }
  return { locked: false, gate: null };
}

export function lockedFeatureLabel(
  gate: AnnotationGate | null | undefined,
  action: string
): string {
  if (gate === "save-to-library") return `Save to library to ${action}`;
  if (gate === "sign-in") return `Sign in to ${action}`;
  return action;
}

export function promptPreloadedSave() {
  window.dispatchEvent(new Event(PRELOADED_SAVE_PROMPT_EVENT));
}
