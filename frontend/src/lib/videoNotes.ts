export function formatVideoTime(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function timestampHref(seconds: number): string {
  return `#t-${Math.max(0, Math.floor(seconds))}`;
}

export function secondsFromTimestampHref(href: string): number | null {
  const m = href.trim().match(/^#t-(\d{1,7})$/);
  if (!m) return null;
  return Number(m[1]);
}

const STAMP_RE =
  /<p><a href="#t-\d+">[^<]*<\/a>(?:&nbsp;|\s)*<\/p>/i;

export function prependTimestamp(html: string, seconds: number): string {
  const label = formatVideoTime(seconds);
  const stamp = `<p><a href="${timestampHref(seconds)}">${label}</a>&nbsp;</p>`;
  const bodyOpen = html.indexOf('class="shelf-doc-body"');
  if (bodyOpen === -1) {
    return `<div class="shelf-doc-editor"><div class="shelf-doc-body">${stamp}<p><br></p></div></div>`;
  }
  const gt = html.indexOf(">", bodyOpen);
  if (gt === -1) return stamp + html;
  const before = html.slice(0, gt + 1);
  const after = html.slice(gt + 1);
  if (STAMP_RE.test(after.slice(0, 120)) && after.includes(timestampHref(seconds))) {
    return html;
  }
  return `${before}${stamp}${after}`;
}
