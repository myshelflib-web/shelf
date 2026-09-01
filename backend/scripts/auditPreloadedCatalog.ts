#!/usr/bin/env tsx
/**
 * Live audit of every preloaded catalog URL (HTTP + embed probe).
 * Usage: npm run preloaded:audit --prefix backend
 */
import { auditPreloadedCatalog, suggestedCatalogFixes } from "../src/services/preloaded/catalogAudit.js";

async function main() {
  console.log("Auditing preloaded catalog URLs (live network checks)…\n");
  const report = await auditPreloadedCatalog();

  console.log(
    `Total: ${report.total} | Loadable: ${report.loadable} | Broken: ${report.broken} | PDF broken: ${report.pdfBroken} | HTML embed-blocked: ${report.embedBlocked}\n`
  );

  const broken = report.rows.filter((r) => !r.loadable);
  if (broken.length > 0) {
    console.log("=== BROKEN ===");
    for (const r of broken) {
      console.log(`- ${r.slug}: ${r.sourceUrl} (${r.issue})`);
    }
    console.log("");
  }

  const fixes = suggestedCatalogFixes(report.rows);
  if (fixes.length > 0) {
    console.log("=== SUGGESTED URL FIXES ===");
    for (const f of fixes) {
      console.log(`- ${f.slug}\n  ${f.from}\n  → ${f.to}`);
    }
    console.log("");
  }

  const fallback = report.rows.filter((r) => r.readerMode === "summary_fallback" && r.loadable);
  console.log(`=== SUMMARY FALLBACK (${fallback.length} loadable non-embed / non-pdf-inline) ===`);
  for (const r of fallback.slice(0, 15)) {
    console.log(`- ${r.slug}: ${r.issue ?? "ok"}`);
  }
  if (fallback.length > 15) {
    console.log(`  … and ${fallback.length - 15} more`);
  }

  if (broken.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
