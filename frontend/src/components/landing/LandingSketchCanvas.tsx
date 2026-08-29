/** Ruled sketch notebook preview for landing mockups. */
export function LandingSketchCanvas({ className = "" }: { className?: string }) {
  return (
    <div
      className={`landing-sketch-canvas relative overflow-hidden rounded-lg border border-[var(--border)] bg-[#faf8f3] ${className}`}
      aria-hidden
    >
      <div className="absolute inset-0 opacity-60">
        {Array.from({ length: 14 }).map((_, i) => (
          <div
            key={i}
            className="border-b border-[#e8e2d6]"
            style={{ height: `${100 / 14}%` }}
          />
        ))}
      </div>
      <div className="absolute left-8 top-0 bottom-0 w-px bg-[#e8b4b4]/70" />
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 320 200"
        preserveAspectRatio="none"
        fill="none"
      >
        <path
          d="M28 42 C 52 38, 78 48, 104 44 S 156 36, 188 42"
          stroke="#4a6fa5"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M28 58 C 48 62, 72 54, 96 60 S 140 68, 176 58"
          stroke="#4a6fa5"
          strokeWidth="1.8"
          strokeLinecap="round"
          opacity="0.85"
        />
        <path
          d="M36 88 C 58 82, 88 94, 118 86 S 168 78, 210 90"
          stroke="#2d3748"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M44 108 Q 72 118, 98 104 T 152 112"
          stroke="#2d3748"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <ellipse
          cx="248"
          cy="118"
          rx="28"
          ry="18"
          stroke="#c05621"
          strokeWidth="1.8"
        />
        <path
          d="M232 118 L 248 102 L 264 118 L 248 134 Z"
          stroke="#c05621"
          strokeWidth="1.4"
          fill="none"
        />
        <path
          d="M52 148 C 78 142, 108 156, 138 148 S 198 138, 240 152"
          stroke="#4a6fa5"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.7"
        />
      </svg>
      <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-white/90 border border-[var(--border)] px-2 py-1 text-[9px] text-[var(--text-muted)]">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
        Sheet 2 of 5
      </div>
    </div>
  );
}
