#!/usr/bin/env npx tsx
import { auditCopyrightCompliance } from "../src/services/preloaded/copyrightCompliance.js";

const report = auditCopyrightCompliance();

console.log(JSON.stringify(report, null, 2));

if (report.summary.error > 0) {
  process.exit(1);
}
