# Content generation — visuals (phased)

Generated Learn pages ship in **two phases** so text quality stays fast and cheap; visuals are optional and admin-triggered.

## Phase 1 — Text + HTML figures (live today)

Starter-pack jobs draft prose, tables, callouts, and **structured HTML figures**:

- `shelf-diagram` — flow, timeline, hierarchy, compare, cycle, cards
- `shelf-glance` — four-card “At a glance” strip

Toggle **Include figures** on the syllabus run. No external image APIs; cost is Sarvam tokens only.

## Phase 2a — CC photos (Openverse)

**Admin → Content generation → Add photos to published pages**

- Targets **already published** generated articles (same subject slugs as the syllabus catalog).
- Searches [Openverse](https://openverse.org/) (Creative Commons / public domain only).
- Downloads **one photo per page** (cost cap), stores it under `admin/.../figures/` in S3, injects a credited `<figure class="shelf-photo">`, and re-uploads `content.html`.
- Skips pages that already have `data-visual-enrich` on the article root.
- **Dry run** — finds a candidate image and records what would be added; does not write S3.

**Cost:** Openverse API is free. No LLM call per page in 2a. One extra S3 object per enriched page.

**Not included in 2a:** Google Image Search (licensing is ambiguous), AI image generation, or Mermaid mind maps.

## Phase 2b — Mind maps (planned)

- Small Sarvam pass to outline 5–8 nodes, render as **Mermaid** in a fenced block (same sanitizer rules as Study AI) or as `shelf-diagram`.
- Optional **one** mind map per page; run only via **Visual enrich**, not on first draft.

## Phase 2c — AI illustrations (planned, expensive)

- Only when Openverse has no suitable hit **and** admin enables “Allow generated images”.
- Budget cap per job (env `CONTENT_GEN_IMAGE_MAX_PER_PAGE`).

## Re-processing already live articles

1. Leave **Skip published** off on a **Visual enrich** run (not a full starter-pack rewrite).
2. Or run **Visual enrich** for a subject — it never rewrites prose, only injects photos.
3. To **regenerate text and figures**, use starter pack with **Skip published** off and **Include figures** on.

## Environment

| Variable | Role |
|----------|------|
| `API_PUBLIC_URL` | Photo `src` in HTML points at `/api/subjects/.../media/figure-1.jpg` on this host |
| `GOOGLE_CSE_*` | Reserved for a future licensed-image search (not wired in 2a) |

## Reader

Photos are served from `GET /api/subjects/:subject/.../articles/:article/media/:file` (S3 proxy, cacheable).

Styles: `frontend/src/app/generated-content.css` — `.shelf-photo`, `.shelf-diagram`.
