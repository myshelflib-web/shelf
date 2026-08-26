/** Prefix used at embed time so vectors encode title + location, not only body. */
export function labeledChunk(
  meta: { title: string; notebook: string; topic: string },
  text: string
): string {
  const loc = meta.topic ? `${meta.notebook} / ${meta.topic}` : meta.notebook;
  return `Title: ${meta.title}\nCollection: ${loc}\n\n${text}`;
}
