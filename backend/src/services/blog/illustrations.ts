/** Branded hero SVG illustrations for blog posts (dark theme, indigo accent). */
export function blogHeroSvg(slug: string): string {
  const theme = themeForSlug(slug);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360" fill="none">
  <rect width="640" height="360" rx="16" fill="#141415"/>
  <rect x="1" y="1" width="638" height="358" rx="15" stroke="#242426" stroke-width="2"/>
  ${theme.background}
  <text x="48" y="300" fill="#9b9ba0" font-family="system-ui,sans-serif" font-size="13" font-weight="500">${theme.label}</text>
</svg>`;
}

function themeForSlug(slug: string): { background: string; label: string } {
  if (slug.includes("study-ai") || slug.includes("goal-aware")) {
    return {
      label: "Study AI",
      background: aiScene(),
    };
  }
  if (slug.includes("pdf") || slug.includes("reader")) {
    return {
      label: "PDF Reader",
      background: pdfScene(),
    };
  }
  if (slug.includes("planner") || slug.includes("dashboard") || slug.includes("streak")) {
    return {
      label: "Planner & Dashboard",
      background: calendarScene(),
    };
  }
  if (slug.includes("library") || slug.includes("curriculum") || slug.includes("learn")) {
    return {
      label: "Study Library",
      background: libraryScene(),
    };
  }
  if (slug.includes("premium") || slug.includes("subscription")) {
    return {
      label: "Shelf Premium",
      background: premiumScene(),
    };
  }
  return {
    label: "Shelf",
    background: defaultScene(),
  };
}

function aiScene(): string {
  return `
  <circle cx="520" cy="88" r="56" fill="rgba(110,121,214,0.12)"/>
  <rect x="72" y="72" width="320" height="200" rx="12" fill="#0c0c0d" stroke="#242426"/>
  <rect x="92" y="96" width="180" height="10" rx="5" fill="#6e79d6" opacity="0.85"/>
  <rect x="92" y="118" width="260" height="8" rx="4" fill="#3a3a3e"/>
  <rect x="92" y="136" width="240" height="8" rx="4" fill="#3a3a3e"/>
  <rect x="92" y="154" width="220" height="8" rx="4" fill="#3a3a3e"/>
  <path d="M420 180 L460 140 L500 170 L540 120" stroke="#6e79d6" stroke-width="3" stroke-linecap="round"/>
  <circle cx="460" cy="140" r="6" fill="#8b93e0"/>`;
}

function pdfScene(): string {
  return `
  <rect x="88" y="64" width="200" height="260" rx="8" fill="#0c0c0d" stroke="#242426"/>
  <rect x="108" y="96" width="160" height="10" rx="4" fill="#ececee" opacity="0.9"/>
  <rect x="108" y="118" width="140" height="6" rx="3" fill="#6e6e73"/>
  <rect x="108" y="134" width="150" height="6" rx="3" fill="#6e6e73"/>
  <rect x="108" y="158" width="120" height="18" rx="4" fill="rgba(245,230,163,0.35)"/>
  <rect x="320" y="100" width="220" height="160" rx="12" fill="#19191b" stroke="#6e79d6" stroke-width="2"/>
  <path d="M350 200 Q390 160 430 200 T510 200" stroke="#6e79d6" stroke-width="4" fill="none" stroke-linecap="round"/>`;
}

function calendarScene(): string {
  return `
  <rect x="80" y="70" width="480" height="220" rx="12" fill="#0c0c0d" stroke="#242426"/>
  <rect x="80" y="70" width="480" height="36" rx="12" fill="#19191b"/>
  ${[0, 1, 2, 3, 4, 5, 6]
    .map(
      (i) =>
        `<rect x="${104 + i * 64}" y="130" width="48" height="64" rx="8" fill="#19191b" stroke="#242426"/>`
    )
    .join("")}
  <rect x="120" y="150" width="32" height="8" rx="4" fill="#6e79d6"/>
  <rect x="248" y="158" width="28" height="8" rx="4" fill="#8b93e0" opacity="0.7"/>`;
}

function libraryScene(): string {
  return `
  <rect x="96" y="88" width="72" height="180" rx="6" fill="#6e79d6" opacity="0.75"/>
  <rect x="184" y="108" width="72" height="160" rx="6" fill="#8b93e0" opacity="0.55"/>
  <rect x="272" y="96" width="72" height="172" rx="6" fill="#6e79d6" opacity="0.65"/>
  <rect x="360" y="116" width="72" height="152" rx="6" fill="#5e66c7" opacity="0.8"/>
  <rect x="448" y="100" width="72" height="168" rx="6" fill="#8b93e0" opacity="0.5"/>
  <rect x="80" y="280" width="480" height="8" rx="4" fill="#242426"/>`;
}

function premiumScene(): string {
  return `
  <polygon points="320,80 360,180 280,180" fill="rgba(110,121,214,0.25)" stroke="#6e79d6" stroke-width="2"/>
  <circle cx="320" cy="148" r="36" fill="#6e79d6" opacity="0.2"/>
  <path d="M320 124 L328 148 L352 148 L334 164 L340 188 L320 172 L300 188 L306 164 L288 148 L312 148 Z" fill="#8b93e0"/>`;
}

function defaultScene(): string {
  return `
  <rect x="120" y="90" width="400" height="180" rx="14" fill="#0c0c0d" stroke="#242426"/>
  <circle cx="200" cy="170" r="40" fill="rgba(110,121,214,0.15)"/>
  <rect x="260" y="140" width="220" height="12" rx="6" fill="#ececee" opacity="0.85"/>
  <rect x="260" y="164" width="180" height="8" rx="4" fill="#6e6e73"/>
  <rect x="260" y="182" width="200" height="8" rx="4" fill="#6e6e73"/>`;
}

export function blogSectionSvg(sectionIndex: number): string {
  const accents = ["#6e79d6", "#8b93e0", "#5e66c7", "#7c85db"];
  const color = accents[sectionIndex % accents.length]!;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="480" height="200" viewBox="0 0 480 200" fill="none">
  <rect width="480" height="200" rx="12" fill="#141415" stroke="#242426"/>
  <rect x="32" y="48" width="120" height="8" rx="4" fill="${color}" opacity="0.9"/>
  <rect x="32" y="68" width="200" height="6" rx="3" fill="#6e6e73"/>
  <rect x="32" y="84" width="180" height="6" rx="3" fill="#6e6e73"/>
  <rect x="32" y="100" width="160" height="6" rx="3" fill="#6e6e73"/>
  <circle cx="380" cy="100" r="48" fill="${color}" opacity="0.12"/>
  <rect x="352" y="88" width="56" height="56" rx="10" stroke="${color}" stroke-width="2" opacity="0.6"/>
</svg>`;
}
