import { PenLine } from "lucide-react";

/** In-app sketch notebook preview — theme tokens, not a flat beige card. */
export function LandingNotebookReader() {
  return (
    <div className="landing-notebook-reader">
      <div className="landing-notebook-toolbar">
        <span className="landing-notebook-tool landing-notebook-tool-active">
          <PenLine className="w-3 h-3" />
          Pen
        </span>
        <span className="landing-notebook-tool">Ruled</span>
        <span className="landing-notebook-tool ml-auto">Sheet 2 / 5</span>
      </div>
      <div className="landing-notebook-sheet">
        <div className="landing-notebook-margin" aria-hidden />
        <svg
          className="landing-notebook-ink"
          viewBox="0 0 280 160"
          fill="none"
          aria-hidden
        >
          <path
            d="M36 36 C58 32, 82 40, 108 36 S162 30, 200 38"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.75"
          />
          <path
            d="M40 58 C64 54, 90 62, 118 56 S172 50, 220 60"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            opacity="0.55"
          />
          <path
            d="M48 92 C72 86, 98 98, 128 90 S188 82, 232 94"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <ellipse cx="210" cy="118" rx="22" ry="14" stroke="currentColor" strokeWidth="1.5" opacity="0.7" />
        </svg>
      </div>
    </div>
  );
}
