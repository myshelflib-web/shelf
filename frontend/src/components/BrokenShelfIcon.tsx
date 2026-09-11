"use client";

import { useId } from "react";

/** Fallen books / cracked plank — same vocabulary as ShelfLogo. */
export function BrokenShelfIcon({
  size = 72,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  const gid = `broken-shelf-grad-${useId().replace(/:/g, "")}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient
          id={gid}
          x1="12"
          y1="8"
          x2="52"
          y2="56"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="var(--accent, #7c6cf0)" />
          <stop offset="1" stopColor="var(--accent-hover, #6354d6)" />
        </linearGradient>
      </defs>
      {/* Soft plate behind the mark */}
      <circle
        cx="32"
        cy="32"
        r="28"
        fill="var(--bg-secondary, #161618)"
        stroke="var(--border, #2a2a2e)"
        strokeWidth="1.25"
      />
      {/* Tilted left volume */}
      <g transform="rotate(-18 22 34)">
        <rect
          x="14"
          y="22"
          width="10"
          height="20"
          rx="2"
          fill="#8fba86"
          opacity="0.85"
        />
      </g>
      {/* Center volume — lean the other way */}
      <g transform="rotate(12 32 30)">
        <rect
          x="27"
          y="16"
          width="10"
          height="26"
          rx="2"
          fill={`url(#${gid})`}
        />
      </g>
      {/* Right volume — tipping off */}
      <g transform="rotate(28 44 36)">
        <rect
          x="39"
          y="26"
          width="10"
          height="16"
          rx="2"
          fill="#c4a07a"
          opacity="0.9"
        />
      </g>
      {/* Cracked shelf plank */}
      <path
        d="M12 48.5h16.5"
        stroke={`url(#${gid})`}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M35.5 48.5H52"
        stroke={`url(#${gid})`}
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.55"
      />
      <path
        d="M28.5 47.5l3.5 3 3.5-3"
        stroke="var(--text-muted, #8a8a92)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
