## Summary

<!-- What and why -->

## Staging (isolated DB + S3)

- [ ] **Frontend-only?** Use the Vercel Preview link — do **not** deploy staging.
- [ ] **Backend / processor / ingestion changed?** Add label `deploy-staging` to update staging images. Staging uses a **separate Neon database** and **separate R2 bucket** (`docs/STAGING.md`). Production is untouched.

## Test plan

- [ ]
