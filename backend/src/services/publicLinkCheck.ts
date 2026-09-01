import type { IngestLinkStatus } from "@prisma/client";
import { checkUrlEmbeddable } from "./importLink.js";
import { parsePublicHttpUrl } from "../utils/publicUrl.js";
import { fetchWithRetry } from "../utils/fetchRetry.js";

const CHECK_TIMEOUT_MS = 12_000;

export type PublicLinkCheckResult = {
  linkStatus: IngestLinkStatus;
  embeddable: boolean | null;
  lastHttpStatus: number | null;
  finalUrl: string;
};

export function statusFromHttp(
  httpStatus: number | null,
  embeddable: boolean
): IngestLinkStatus {
  if (httpStatus === null) return "UNKNOWN";
  if (httpStatus === 404 || httpStatus === 410 || httpStatus >= 500) return "BROKEN";
  if (!embeddable) return "BLOCKED_EMBED";
  if (httpStatus >= 200 && httpStatus < 400) return "OK";
  return "UNKNOWN";
}

export function sameHostname(a: string, b: string): boolean {
  try {
    return new URL(a).hostname === new URL(b).hostname;
  } catch {
    return false;
  }
}

export async function checkPublicLink(rawUrl: string): Promise<PublicLinkCheckResult> {
  const safe = parsePublicHttpUrl(rawUrl);
  if (!safe) {
    return {
      linkStatus: "BROKEN",
      embeddable: false,
      lastHttpStatus: null,
      finalUrl: rawUrl,
    };
  }

  let httpStatus: number | null = null;
  try {
    const head = await fetchWithRetry(safe, {
      method: "HEAD",
      redirect: "follow",
      timeoutMs: CHECK_TIMEOUT_MS,
      headers: {
        "User-Agent": "ShelfLinkCheck/1.0 (link health; +https://myshelflib.com)",
        Accept: "*/*",
      },
    });
    httpStatus = head.status;
    try {
      await head.body?.cancel();
    } catch {
      /* ignore */
    }
  } catch {
    httpStatus = null;
  }

  const embedProbe = await checkUrlEmbeddable(safe);
  const embeddable = embedProbe.embeddable;
  const linkStatus = statusFromHttp(httpStatus, embeddable);

  return {
    linkStatus,
    embeddable,
    lastHttpStatus: httpStatus,
    finalUrl: embedProbe.finalUrl,
  };
}
