import { ExternalLink } from "lucide-react";

export function OfficialSourceAttributionBar({
  label,
  url,
}: {
  label: string;
  url: string;
}) {
  return (
    <div
      className="shrink-0 flex items-center justify-between gap-3 border-t border-[var(--border)] bg-[var(--bg-primary)]/95 px-3 py-2 text-xs text-[var(--text-secondary)] backdrop-blur-sm"
      role="note"
      aria-label="Official document source"
    >
      <span className="min-w-0 truncate">
        Source: <span className="font-medium text-[var(--text-primary)]">{label}</span>
      </span>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex shrink-0 items-center gap-1 text-[var(--accent)] hover:underline"
      >
        Open official link
        <ExternalLink className="h-3 w-3" aria-hidden />
      </a>
    </div>
  );
}
