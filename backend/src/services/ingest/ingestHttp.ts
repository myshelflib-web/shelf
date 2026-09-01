/** Browser-like headers — many .gov.in endpoints block custom/bot user agents. */
export function ingestFetchHeaders(extra?: Record<string, string>): Record<string, string> {
  return {
    "User-Agent":
      "Mozilla/5.0 (compatible; ShelfIngest/1.0; +https://shelf.study; government-feed-ingest)",
    Accept: "application/rss+xml, application/xml, text/xml, text/html, */*;q=0.8",
    "Accept-Language": "en-IN,en;q=0.9",
    ...extra,
  };
}
