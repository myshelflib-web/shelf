import { describe, expect, it } from "vitest";
import { parseRssXml } from "./rssParser.js";

const SAMPLE = `<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <item>
      <title>Test Release</title>
      <link>https://pib.gov.in/PressReleasePage.aspx?PRID=123</link>
      <guid>https://pib.gov.in/PressReleasePage.aspx?PRID=123</guid>
      <pubDate>Mon, 01 Sep 2025 10:00:00 GMT</pubDate>
      <description><![CDATA[Ministry announced a pilot programme.]]></description>
    </item>
  </channel>
</rss>`;

describe("parseRssXml", () => {
  it("parses items with title, link, description", () => {
    const entries = parseRssXml(SAMPLE);
    expect(entries).toHaveLength(1);
    expect(entries[0].title).toBe("Test Release");
    expect(entries[0].canonicalUrl).toContain("pib.gov.in");
    expect(entries[0].description).toContain("pilot programme");
  });
});
