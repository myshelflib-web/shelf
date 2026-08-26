import { ChatMessage, ChatThreadSummary, LibraryCitation } from "@/types";
import { normalizeContextKind } from "@/lib/studyAiContextLabel";

export type WorkspaceMessage = ChatMessage & { streaming?: boolean };

export type PopoverKind = "attach" | "chat" | null;

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read image"));
    reader.readAsDataURL(file);
  });
}

export function asChatMessage(value: unknown): ChatMessage | null {
  if (!value || typeof value !== "object") return null;
  const rec = value as Partial<ChatMessage>;
  if (!rec.id || !rec.role || typeof rec.content !== "string") return null;
  return rec as ChatMessage;
}

export function asCitations(value: unknown): LibraryCitation[] | undefined {
  if (!Array.isArray(value) || value.length === 0) return undefined;
  return value as LibraryCitation[];
}

export function threadSidebarMeta(t: ChatThreadSummary): string | null {
  if (t.relevancyDoc?.title) return t.relevancyDoc.title;
  if (normalizeContextKind(t.contextKind) !== "LIBRARY") return "Library scope";
  return null;
}

export function positionPopover(menu: HTMLElement, anchor: HTMLElement) {
  const r = anchor.getBoundingClientRect();
  const m = menu.getBoundingClientRect();
  const gap = 8;
  const edge = 12;

  let left = r.left;
  if (left + m.width > window.innerWidth - edge) {
    left = window.innerWidth - m.width - edge;
  }
  if (left < edge) left = edge;

  const roomBelow = window.innerHeight - r.bottom;
  const roomAbove = r.top;

  let top: number;
  if (roomBelow >= m.height + gap) {
    top = r.bottom + gap;
  } else if (roomAbove >= m.height + gap) {
    top = r.top - m.height - gap;
  } else {
    top = Math.max(edge, window.innerHeight - m.height - edge);
  }

  menu.style.left = `${left}px`;
  menu.style.top = `${top}px`;
}
