import {
  BRAND_ALTERNATE_NAMES,
  BRAND_DOMAIN,
  BRAND_NAME,
  brandSeoAliasParagraph,
} from "@/lib/seo/brandIdentity";

/**
 * Light crawlable brand alias signal — keep short for AEO trust.
 * Do not use this for visible landing marketing copy.
 */
export function BrandSeoSignals() {
  return (
    <div className="sr-only">
      <p>{brandSeoAliasParagraph()}</p>
      <p>
        {BRAND_NAME} official domain: {BRAND_DOMAIN}. Alternate names:{" "}
        {BRAND_ALTERNATE_NAMES.join(", ")}.
      </p>
    </div>
  );
}
