import { ExternalLink } from "lucide-react";

/** Native open control for preloaded portal pages (iframe blocked). */
export function PreloadedOfficialOpenBar({
  url,
  disabled,
}: {
  url: string;
  disabled?: boolean;
}) {
  if (disabled) return null;

  return (
    <div className="preloaded-official-open-bar shrink-0 px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-primary)]">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="preloaded-official-fallback__cta"
      >
        Open on official site
        <ExternalLink className="ml-1.5 h-3.5 w-3.5" aria-hidden />
      </a>
    </div>
  );
}
