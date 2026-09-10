/**
 * Map API paths to explorer entity keys for item/folder sync badges.
 * Keys: `page:{id}`, `subject:{id}`, `topic:{id}`.
 */

export function entityKeysFromApiPath(path: string): string[] {
  const keys: string[] = [];
  const page = path.match(/\/pages\/([0-9a-f-]{36})(?:\/|$|\?)/i);
  if (page?.[1]) keys.push(`page:${page[1]}`);

  const topic = path.match(
    /\/topic-groups\/([0-9a-f-]{36})(?:\/|$|\?)/i
  );
  if (topic?.[1]) keys.push(`topic:${topic[1]}`);

  const subject = path.match(
    /\/subjects\/([0-9a-f-]{36})(?:\/|$|\?)/i
  );
  if (subject?.[1]) keys.push(`subject:${subject[1]}`);

  return keys;
}

export function pageIdFromEntityKey(key: string): string | null {
  return key.startsWith("page:") ? key.slice(5) : null;
}

export function isPageEntityKey(key: string): boolean {
  return key.startsWith("page:");
}
