/** Shared Shelf mark for Next.js `ImageResponse` PWA icons (no CSS variables). */
export function shelfPwaIconImage(size: number) {
  const accent = "#6e79d6";
  const bg = "#19191b";
  const green = "#8fba86";
  const tan = "#c4a07a";

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: bg,
        borderRadius: size * 0.25,
      }}
    >
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="5.5" r="2" fill={accent} opacity={0.55} />
        <path
          d="M8 10.5c0-1.1.9-2 2-2h1.2c.6 0 1.1.3 1.4.8l.4.6.4-.6c.3-.5.8-.8 1.4-.8H16c1.1 0 2 .9 2 2v.5H8v-.5Z"
          fill={accent}
          opacity={0.35}
        />
        <rect x="7" y="13" width="5.5" height="11" rx="1.25" fill={green} opacity={0.85} />
        <rect x="13.25" y="9" width="5.5" height="15" rx="1.25" fill={accent} />
        <rect x="19.5" y="15" width="5.5" height="9" rx="1.25" fill={tan} opacity={0.9} />
        <path d="M5 26.5h22" stroke={accent} strokeWidth="2.75" strokeLinecap="round" />
      </svg>
    </div>
  );
}
