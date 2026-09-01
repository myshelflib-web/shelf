import { parsePublicHttpUrl } from "../../utils/publicUrl.js";
import { fetchWithRetry } from "../../utils/fetchRetry.js";
import { ingestFetchHeaders } from "./ingestHttp.js";
import { assertOfficialRedistributionAllowed } from "../preloaded/copyrightCompliance.js";

export const OFFICIAL_PDF_MAX_BYTES = 50 * 1024 * 1024;

export async function downloadOfficialPdf(url: string): Promise<Buffer> {
  assertOfficialRedistributionAllowed(url);
  const safe = parsePublicHttpUrl(url);
  if (!safe) throw new Error("PDF URL is not allowed.");

  const res = await fetchWithRetry(safe, {
    timeoutMs: 120_000,
    redirect: "follow",
    headers: ingestFetchHeaders({ Accept: "application/pdf, */*" }),
  });
  if (!res.ok) throw new Error(`PDF download failed (${res.status}).`);

  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length > OFFICIAL_PDF_MAX_BYTES) {
    throw new Error("PDF exceeds ingest size limit.");
  }
  if (buffer.length < 512) throw new Error("PDF appears empty or invalid.");
  return buffer;
}
