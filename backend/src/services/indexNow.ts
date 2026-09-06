import { fetchWithRetry } from "../utils/fetchRetry.js";
import { logger } from "../utils/logger.js";
import { getAppUrl } from "./email/config.js";

/**
 * Public IndexNow key (not a secret). Hosted at /{key}.txt on the frontend.
 * Override with INDEXNOW_KEY only if you also replace the public key file.
 */
export const INDEXNOW_KEY_DEFAULT = "c8e41f92a7b64d0e9f3c1a5b8d7e6f20";

function indexNowKey(): string {
  return process.env.INDEXNOW_KEY?.trim() || INDEXNOW_KEY_DEFAULT;
}

/** Notify Bing/Yandex (and IndexNow partners) that public URLs changed. */
export async function submitIndexNow(paths: string[]): Promise<number> {
  const unique = [
    ...new Set(
      paths
        .map((p) => p.trim())
        .filter((p) => p.startsWith("/"))
    ),
  ];
  if (unique.length === 0) return 0;

  const hostUrl = getAppUrl();
  let host: string;
  try {
    host = new URL(hostUrl).host;
  } catch {
    return 0;
  }

  // Local / preview hosts are not useful for IndexNow.
  if (host.includes("localhost") || host.endsWith(".vercel.app")) return 0;

  const key = indexNowKey();
  const urlList = unique.map((path) => `${hostUrl}${path}`);

  try {
    const res = await fetchWithRetry("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host,
        key,
        keyLocation: `${hostUrl}/${key}.txt`,
        urlList,
      }),
      timeoutMs: 8_000,
      retry: { attempts: 2, label: "indexnow" },
    });
    if (!res.ok && res.status !== 202) {
      logger.warn("indexnow.submit_failed", {
        status: res.status,
        count: urlList.length,
      });
      return 0;
    }
    logger.info("indexnow.submitted", { count: urlList.length, host });
    return urlList.length;
  } catch (err) {
    logger.warn("indexnow.submit_error", {
      error: err instanceof Error ? err.message : String(err),
      count: urlList.length,
    });
    return 0;
  }
}

/** Fire-and-forget IndexNow for a single public path. */
export function scheduleIndexNow(path: string): void {
  void submitIndexNow([path]).catch(() => {});
}
