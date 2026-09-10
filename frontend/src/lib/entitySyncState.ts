/** Sticky failed/pending entity keys for explorer sync badges. */

export const ENTITY_SYNC_EVENT = "shelf:entity-sync";

const FAILED_STORAGE = "shelf:sync-failed-entities";

function readStored(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(FAILED_STORAGE);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(
      parsed.filter((x): x is string => typeof x === "string" && x.length > 0)
    );
  } catch {
    return new Set();
  }
}

function writeStored(keys: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(FAILED_STORAGE, JSON.stringify([...keys]));
  } catch {
    /* ignore */
  }
}

function emit() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(ENTITY_SYNC_EVENT));
}

export function readFailedEntityKeys(): Set<string> {
  return readStored();
}

export function markEntitiesFailed(keys: string[]): void {
  if (!keys.length) return;
  const next = readStored();
  let changed = false;
  for (const k of keys) {
    if (!next.has(k)) {
      next.add(k);
      changed = true;
    }
  }
  if (!changed) return;
  writeStored(next);
  emit();
}

export function clearEntitiesFailed(keys: string[]): void {
  if (!keys.length) return;
  const next = readStored();
  let changed = false;
  for (const k of keys) {
    if (next.delete(k)) changed = true;
  }
  if (!changed) return;
  writeStored(next);
  emit();
}

export function clearAllFailedEntities(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(FAILED_STORAGE);
  } catch {
    /* ignore */
  }
  emit();
}
