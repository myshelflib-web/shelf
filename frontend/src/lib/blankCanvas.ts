export const BLANK_MIN_W = 4800;
export const BLANK_MIN_H = 6400;
export const BLANK_TEXT_BOX_W = 280;

/** Default draw-canvas fill (blackboard). */
export const DEFAULT_CANVAS_BG = "#0c0c0d";

export const CANVAS_BACKGROUNDS = [
  { id: "black", color: "#0c0c0d", label: "Black" },
  { id: "charcoal", color: "#1a1a1c", label: "Charcoal" },
  { id: "navy", color: "#0f172a", label: "Navy" },
  { id: "white", color: "#ffffff", label: "White" },
  { id: "paper", color: "#f4f1ea", label: "Paper" },
  { id: "mist", color: "#e8eef4", label: "Mist" },
] as const;

const HEX_BG = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

export function normalizeCanvasBg(value: string | null | undefined): string {
  const v = (value ?? "").trim();
  if (HEX_BG.test(v)) return v.toLowerCase();
  return DEFAULT_CANVAS_BG;
}

export function canvasBgIsDark(hex: string): boolean {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? [...h].map((c) => c + c).join("") : h;
  const n = Number.parseInt(full, 16);
  if (!Number.isFinite(n)) return true;
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b < 150;
}

export function canvasFgColor(bg: string): string {
  return canvasBgIsDark(bg) ? "#ececee" : "#1a1a18";
}

export function canvasBgTone(bg: string): "dark" | "light" {
  return canvasBgIsDark(bg) ? "dark" : "light";
}

/** Read stored canvas fill from HTML without a DOM parse. */
export function readCanvasBg(html: string): string {
  const m = html.match(/data-bg="(#[0-9a-fA-F]{3,8})"/);
  return m ? normalizeCanvasBg(m[1]) : DEFAULT_CANVAS_BG;
}

export type BlankPt = { x: number; y: number };

export type BlankStroke = {
  d: string;
  color: string;
  width: number;
};

export type BlankTextBox = {
  id: string;
  x: number;
  y: number;
  w: number;
  html: string;
};

export function blankUid() {
  return `tb-${Math.random().toString(36).slice(2, 10)}`;
}

export function isBlankCanvasHtml(html: string): boolean {
  return /shelf-blank-canvas/.test(html);
}

export function isEmptyBoxHtml(html: string): boolean {
  const t = html.replace(/&nbsp;/gi, " ").replace(/\s+/g, "").toLowerCase();
  return !t || t === "<br>" || t === "<p><br></p>" || t === "<p></p>" || t === "<div><br></div>";
}

export function pointsToPath(points: BlankPt[]): string {
  return points
    .map(
      (p, i) =>
        `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`
    )
    .join(" ");
}

export function serializeBlankCanvas(
  w: number,
  h: number,
  boxes: BlankTextBox[],
  paths: BlankStroke[],
  bg: string = DEFAULT_CANVAS_BG
): string {
  const color = normalizeCanvasBg(bg);
  const fg = canvasFgColor(color);
  const tone = canvasBgTone(color);
  const boxesHtml = boxes
    .map(
      (b) =>
        `<div class="shelf-text-box" data-id="${b.id}" data-x="${Math.round(b.x)}" data-y="${Math.round(b.y)}" data-w="${Math.round(b.w)}" style="left: ${Math.round(b.x)}px; top: ${Math.round(b.y)}px; width: ${Math.round(b.w)}px;">${b.html}</div>`
    )
    .join("");
  const pathHtml = paths
    .map(
      (p) =>
        `<path class="blank-draw-stroke" d="${p.d.replace(/"/g, "")}" fill="none" stroke="${p.color.replace(/"/g, "")}" stroke-width="${p.width}" stroke-linecap="round" stroke-linejoin="round"></path>`
    )
    .join("");
  return `<div class="shelf-blank-canvas" data-w="${w}" data-h="${h}" data-bg="${color}" data-bg-tone="${tone}" style="width: ${w}px; height: ${h}px; background-color: ${color}; color: ${fg};"><div class="shelf-blank-textboxes">${boxesHtml}</div><svg class="blank-draw-layer" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${pathHtml}</svg></div>`;
}

export function parseBlankCanvas(html: string): {
  w: number;
  h: number;
  boxes: BlankTextBox[];
  paths: BlankStroke[];
  bg: string;
} {
  if (typeof document === "undefined") {
    return {
      w: BLANK_MIN_W,
      h: BLANK_MIN_H,
      boxes: [],
      paths: [],
      bg: readCanvasBg(html),
    };
  }
  const wrap = document.createElement("div");
  wrap.innerHTML = html;
  const canvas = wrap.querySelector(".shelf-blank-canvas") as HTMLElement | null;
  if (!canvas) {
    return {
      w: BLANK_MIN_W,
      h: BLANK_MIN_H,
      boxes: [
        {
          id: blankUid(),
          x: BLANK_MIN_W / 2 - 200,
          y: BLANK_MIN_H / 2 - 120,
          w: 400,
          html: html.trim() || "<p><br></p>",
        },
      ],
      paths: [],
      bg: DEFAULT_CANVAS_BG,
    };
  }
  const w = Math.max(BLANK_MIN_W, Number(canvas.getAttribute("data-w")) || BLANK_MIN_W);
  const h = Math.max(BLANK_MIN_H, Number(canvas.getAttribute("data-h")) || BLANK_MIN_H);

  const boxEls = [
    ...canvas.querySelectorAll(".shelf-text-box"),
  ] as HTMLElement[];
  const boxes: BlankTextBox[] = boxEls.map((el) => ({
    id: el.getAttribute("data-id") || blankUid(),
    x: Number(el.getAttribute("data-x")) || 0,
    y: Number(el.getAttribute("data-y")) || 0,
    w: Number(el.getAttribute("data-w")) || BLANK_TEXT_BOX_W,
    html: el.innerHTML || "<p><br></p>",
  }));

  const legacy =
    (canvas.querySelector(".shelf-blank-text") as HTMLElement | null)
      ?.innerHTML ?? "";
  if (!boxes.length && legacy.trim()) {
    boxes.push({
      id: blankUid(),
      x: w / 2 - 200,
      y: h / 2 - 120,
      w: 400,
      html: legacy,
    });
  }
  if (!boxes.length) {
    boxes.push({
      id: blankUid(),
      x: w / 2 - 200,
      y: h / 2 - 80,
      w: 400,
      html: "<p><br></p>",
    });
  }

  const paths: BlankStroke[] = [
    ...canvas.querySelectorAll("svg.blank-draw-layer path"),
  ]
    .map((p) => ({
      d: p.getAttribute("d") || "",
      color: p.getAttribute("stroke") || "#1f2937",
      width: Number(p.getAttribute("stroke-width")) || 2.5,
    }))
    .filter((p) => p.d);

  const bg = normalizeCanvasBg(canvas.getAttribute("data-bg"));

  return { w, h, boxes, paths, bg };
}

/** Pan the 4800×6400 canvas so ink/text sit in the viewport (not the empty origin). */
export function blankCanvasScrollTarget(
  html: string,
  viewW: number,
  viewH: number
): { left: number; top: number } | null {
  if (!/shelf-blank-canvas/.test(html)) return null;
  const cw =
    Number(html.match(/data-w="(\d+)"/)?.[1]) || BLANK_MIN_W;
  const ch =
    Number(html.match(/data-h="(\d+)"/)?.[1]) || BLANK_MIN_H;

  const xs: number[] = [];
  const ys: number[] = [];

  const boxRe = /data-x="(-?\d+)"[^>]*data-y="(-?\d+)"[^>]*data-w="(\d+)"/g;
  let m: RegExpExecArray | null;
  while ((m = boxRe.exec(html))) {
    const x = Number(m[1]);
    const y = Number(m[2]);
    const w = Number(m[3]) || BLANK_TEXT_BOX_W;
    xs.push(x, x + w);
    ys.push(y, y + 80);
  }

  const pathRe = /[ML]\s*([-\d.]+)\s+([-\d.]+)/gi;
  while ((m = pathRe.exec(html))) {
    xs.push(Number(m[1]));
    ys.push(Number(m[2]));
  }

  let cx: number;
  let cy: number;
  if (xs.length && ys.length) {
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    cx = (minX + maxX) / 2;
    cy = (minY + maxY) / 2;
  } else {
    cx = cw / 2;
    cy = ch / 2;
  }

  const left = Math.max(0, Math.min(cw - viewW, cx - viewW / 2));
  const top = Math.max(0, Math.min(ch - viewH, cy - viewH / 2));
  return {
    left: Number.isFinite(left) ? Math.round(left) : 0,
    top: Number.isFinite(top) ? Math.round(top) : 0,
  };
}
