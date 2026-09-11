"use client";

import { useId } from "react";

interface ShelfLogoProps {
  size?: number;
  className?: string;
  showWordmark?: boolean;
  /** Soft book bob + sparkle — use on full-screen loaders. */
  lively?: boolean;
}

/** Shelf mark — stacked volumes on a shelf with a knowledge spark. */
export function ShelfLogo({
  size = 28,
  className = "",
  showWordmark = false,
  lively = false,
}: ShelfLogoProps) {
  const gid = `shelf-logo-grad-${useId().replace(/:/g, "")}`;
  const icon = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${lively ? "shelf-logo-lively" : ""} ${className}`.trim()}
      aria-hidden
    >
      <defs>
        <linearGradient
          id={gid}
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
      <circle
        className="shelf-logo-spark"
        cx="16"
        cy="5.5"
        r="2"
        fill={`url(#${gid})`}
        opacity="0.55"
      />
      <path
        className="shelf-logo-cap"
        d="M8 10.5c0-1.1.9-2 2-2h1.2c.6 0 1.1.3 1.4.8l.4.6.4-.6c.3-.5.8-.8 1.4-.8H16c1.1 0 2 .9 2 2v.5H8v-.5Z"
        fill={`url(#${gid})`}
        opacity="0.35"
      />
      <rect
        className="shelf-logo-book shelf-logo-book-a"
        x="7"
        y="13"
        width="5.5"
        height="11"
        rx="1.25"
        fill="#8fba86"
        opacity="0.85"
      />
      <rect
        className="shelf-logo-book shelf-logo-book-b"
        x="13.25"
        y="9"
        width="5.5"
        height="15"
        rx="1.25"
        fill={`url(#${gid})`}
      />
      <rect
        className="shelf-logo-book shelf-logo-book-c"
        x="19.5"
        y="15"
        width="5.5"
        height="9"
        rx="1.25"
        fill="#c4a07a"
        opacity="0.9"
      />
      <path
        className="shelf-logo-plank"
        d="M5 26.5h22"
        stroke={`url(#${gid})`}
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
