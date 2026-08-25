interface ShelfLogoProps {
  size?: number;
  className?: string;
  showWordmark?: boolean;
}

/** Shelf mark — stacked volumes on a shelf with a knowledge spark. */
export function ShelfLogo({
  size = 28,
  className = "",
  showWordmark = false,
}: ShelfLogoProps) {
  const icon = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient
          id="shelf-logo-grad"
          x1="6"
          y1="4"
          x2="26"
          y2="28"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="var(--accent)" />
          <stop offset="1" stopColor="var(--accent-hover)" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="5.5" r="2" fill="url(#shelf-logo-grad)" opacity="0.55" />
      <path
        d="M8 10.5c0-1.1.9-2 2-2h1.2c.6 0 1.1.3 1.4.8l.4.6.4-.6c.3-.5.8-.8 1.4-.8H16c1.1 0 2 .9 2 2v.5H8v-.5Z"
        fill="url(#shelf-logo-grad)"
        opacity="0.35"
      />
      <rect
        x="7"
        y="13"
        width="5.5"
        height="11"
        rx="1.25"
        fill="#8fba86"
        opacity="0.85"
      />
      <rect x="13.25" y="9" width="5.5" height="15" rx="1.25" fill="url(#shelf-logo-grad)" />
      <rect
        x="19.5"
        y="15"
        width="5.5"
        height="9"
        rx="1.25"
        fill="#c4a07a"
        opacity="0.9"
      />
      <path
        d="M5 26.5h22"
        stroke="url(#shelf-logo-grad)"
        strokeWidth="2.75"
        strokeLinecap="round"
      />
    </svg>
  );

  if (!showWordmark) return icon;

  return (
    <span className="inline-flex items-center gap-2.5">
      {icon}
      <span className="font-semibold tracking-tight text-[var(--text-primary)]">
        Shelf
      </span>
    </span>
  );
}
