# Copyright compliance — internal reference

**Not legal advice.** Use this document with Indian copyright counsel before scaling public PDF hosting.

## Policy summary

| Content type | What Shelf stores/serves | Full text publicly? |
|--------------|--------------------------|---------------------|
| `LINK_ONLY` | Title, link, Shelf summary | No |
| `GOVERNMENT_PRESS` | Title, link, ≤280 char RSS excerpt | No |
| `OFFICIAL_DOCUMENT` | Link, optional S3 mirror/proxy for Learn | PDF only for allowlisted gov hosts |
| User uploads | Private `users/` storage | No (account-scoped) |

## Rationale — NCERT / official PDF mirroring

Shelf mirrors or proxies official PDFs only when:

1. Entry is tagged `OFFICIAL_DOCUMENT` in the preloaded catalog or ingest source.
2. URL hostname is on `OFFICIAL_REDISTRIBUTION_HOSTS` (`copyrightCompliance.ts`).
3. Mirror runs only when in-app embed is unreliable (`PRELOADED_MIRROR_PDF`).

**Business rationale:** NCERT and Union Budget materials are published free by the Government of India for educational access; Shelf provides the same documents with attribution when official sites block embeds or are unstable.

**Legal review checklist (counsel to sign off):**

- [ ] Reproduction of NCERT PDFs on a commercial/education platform is permitted under Indian law and publisher terms.
- [ ] Union Budget / UPSC notification PDFs may be mirrored with attribution.
- [ ] Safe-harbour / notice-and-takedown process satisfies IT Rules 2021 for intermediary liability.
- [ ] Public Terms and `/legal/copyright` are sufficient for user-upload warranties.

## Automated checks

```bash
npm run preloaded:copyright-audit --prefix backend   # catalog + ingest license audit
npm run check --prefix backend
npm run check --prefix frontend
```

CI runs `preloaded:copyright-audit` on backend changes.

## Takedown contact

Public page: `/legal/copyright` — email `hello@shelf.study` with URL and rights-holder details.
