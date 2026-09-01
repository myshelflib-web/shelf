import type { Request, Response } from "express";
import { parsePublicHttpUrl } from "../utils/publicUrl.js";
import { fetchWithRetry } from "../utils/fetchRetry.js";
import { ingestFetchHeaders } from "./ingest/ingestHttp.js";
import { assertOfficialRedistributionAllowed } from "./preloaded/copyrightCompliance.js";

/** Stream an official PDF URL through Shelf (Range-aware) for the Learn reader. */
export async function pipeRemoteSourcePdf(
  req: Request,
  res: Response,
  sourceUrl: string
): Promise<void> {
  assertOfficialRedistributionAllowed(sourceUrl);
  const safe = parsePublicHttpUrl(sourceUrl.trim());
  if (!safe) {
    res.status(400).json({ error: "PDF URL is not allowed." });
    return;
  }

  const rangeHeader = req.headers.range;
  const headers = ingestFetchHeaders({
    Accept: "application/pdf, */*",
    ...(typeof rangeHeader === "string" ? { Range: rangeHeader } : {}),
  });

  let remote: globalThis.Response;
  try {
    remote = await fetchWithRetry(safe, {
      method: req.method === "HEAD" ? "HEAD" : "GET",
      redirect: "follow",
      timeoutMs: 120_000,
      headers,
    });
  } catch {
    res.status(502).json({ error: "Could not fetch official PDF." });
    return;
  }

  if (!remote.ok && remote.status !== 206) {
    res.status(remote.status === 404 ? 404 : 502).json({
      error: `Official PDF unavailable (${remote.status}).`,
    });
    return;
  }

  const contentType = remote.headers.get("content-type") || "application/pdf";
  res.setHeader("Content-Type", contentType);
  res.setHeader("Content-Disposition", "inline");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.setHeader("Accept-Ranges", remote.headers.get("accept-ranges") || "bytes");

  const contentLength = remote.headers.get("content-length");
  if (contentLength) res.setHeader("Content-Length", contentLength);

  const contentRange = remote.headers.get("content-range");
  if (contentRange) res.setHeader("Content-Range", contentRange);

  res.setHeader(
    "Access-Control-Expose-Headers",
    "Accept-Ranges, Content-Range, Content-Length, Content-Type"
  );

  res.status(remote.status);

  if (req.method === "HEAD") {
    res.end();
    return;
  }

  if (!remote.body) {
    res.end();
    return;
  }

  const { Readable } = await import("node:stream");
  const nodeStream = Readable.fromWeb(
    remote.body as import("stream/web").ReadableStream
  );
  nodeStream.pipe(res);
}
