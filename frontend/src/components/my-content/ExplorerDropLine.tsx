export function ExplorerDropLine({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div className="h-0.5 rounded-full bg-[var(--accent)] mx-1 my-0.5" />
  );
}
