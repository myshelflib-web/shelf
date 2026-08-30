import {
  BRAND_ALTERNATE_NAMES,
  BRAND_DOMAIN,
  BRAND_NAME,
  brandSeoAliasParagraph,
} from "@/lib/seo/brandIdentity";

/**
 * Crawlable brand / misspelling signals only — visually hidden.
 * Do not use this for visible landing marketing copy.
 */
export function BrandSeoSignals() {
  return (
    <div className="sr-only" aria-hidden="true">
      <p>{brandSeoAliasParagraph()}</p>
      <p>
        {BRAND_NAME} alternate names for search:{" "}
        {BRAND_ALTERNATE_NAMES.join(", ")}. Domain: {BRAND_DOMAIN}.
      </p>
    </div>
  );
}
