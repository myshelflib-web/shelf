/** Canonical brand identity for SEO — not shown as visible landing copy. */

export const BRAND_NAME = "Shelf";

/** Domain people type when they remember the site, not the short name. */
export const BRAND_DOMAIN = "myshelflib.com";

/**
 * Clean alternate names for schema.org `alternateName`.
 * Keep this list legitimate brand aliases (not every typo).
 */
export const BRAND_ALTERNATE_NAMES = [
  "myshelflib",
  "My Shelf Lib",
  "my shelf lib",
  "MyShelfLib",
  "My Shelf",
  "my shelf",
  "Shelf library",
  "Shelf study library",
  "Shelf app",
  "Shelf PDF library",
  "myshelflib.com",
  "www.myshelflib.com",
] as const;

/**
 * Full brand search / misspelling signal list for meta keywords + crawl-only text.
 * Includes truncations, typos, spaced forms, and domain variants people may type.
 */
export const BRAND_SEARCH_VARIANTS = [
  // Canonical
  "Shelf",
  "shelf",
  "SHELF",
  "myshelflib",
  "MyShelfLib",
  "my shelf lib",
  "My Shelf Lib",
  "my shelf",
  "My Shelf",
  "myshelflib.com",
  "www.myshelflib.com",
  "https://myshelflib.com",
  // Product phrases
  "Shelf library",
  "Shelf study library",
  "Shelf app",
  "Shelf PDF",
  "Shelf PDF library",
  "Shelf study app",
  "Shelf notes",
  "Shelf study",
  "my Shelf",
  "myShelf",
  "myshelf",
  "my shelflib",
  "my shelf library",
  "shelf lib",
  "shelflib",
  "shelf.lib",
  "shelf library app",
  // Truncations / partials
  "shel",
  "shelfl",
  "shelfi",
  "shelfli",
  "shelflib",
  "my shel",
  "my shelfl",
  "my shelfi",
  "myshel",
  "myshelf",
  "myshelfl",
  "myshelfi",
  "myshelfli",
  "m shelf",
  "m shelf lib",
  // Common misspellings
  "sheld",
  "shelve",
  "shelves app",
  "sheld library",
  "shef",
  "shefl",
  "sheflib",
  "shefl library",
  "shellf",
  "shellf lib",
  "sheelf",
  "sheelf lib",
  "shlef",
  "shlef lib",
  "shself",
  "self library app",
  "shelfllib",
  "shelfllib.com",
  "myshelflibcom",
  "my-shelf-lib",
  "my_shelf_lib",
  "my.shelf.lib",
  "myshelf lib",
  "my shelflib.com",
  "shelf lib.com",
  "shelfapp",
  "shelf-app",
  "shelfapp.com",
  // Domain typos
  "myshelflib.co",
  "myshelflib.in",
  "myshelflib.org",
  "myshelfllib.com",
  "myshelflib.com",
  "myshelflb.com",
  "myshelib.com",
  "myshelflibcom.com",
  "my-shelflib.com",
  "myshelf-lib.com",
  // Spaced / spoken
  "my shelf lib app",
  "shelf my library",
  "open shelf library",
  "shelf personal library",
  "go to shelf",
  "login shelf",
  "shelf login",
  "shelf sign in",
] as const;

/** Meta keywords aimed at brand / navigational queries (deduped variants). */
export const BRAND_KEYWORDS: string[] = Array.from(
  new Set(
    [...BRAND_ALTERNATE_NAMES, ...BRAND_SEARCH_VARIANTS].map((s) => s.trim())
  )
);

export const BRAND_TAGLINE =
  "Shelf (myshelflib) is your personal study library for PDFs, highlights, Study AI, and planning.";

export const BRAND_HOME_TITLE =
  "Shelf (myshelflib) — Personal Study Library | PDFs, Study AI & Planner";

export const BRAND_HOME_DESCRIPTION =
  "Shelf — also called My Shelf Lib / myshelflib — is a personal study library: upload PDFs and YouTube lectures, highlight as you read, ask Study AI from your notes, Share Shelf with classmates, and plan on one calendar.";

export const BRAND_FAQS = [
  {
    question: "What is Shelf / myshelflib?",
    answer:
      "Shelf (website myshelflib.com, also searched as My Shelf Lib, my shelf, shelflib, or myshelf) is a personal study library app. Upload PDFs, highlight notes, ask Study AI from your material, share documents, and plan revision — your private library at /my-content.",
  },
  {
    question: "Is My Shelf Lib the same as Shelf?",
    answer:
      "Yes. Shelf is the product name; myshelflib.com and My Shelf Lib are how many people find and refer to the same study library app. Searches like my shelf, shel, sheld, shelflib, or myshelf usually mean this product.",
  },
  {
    question: "How do I open my Shelf library?",
    answer:
      "Go to myshelflib.com, sign in, and open My Content. Guests can browse free curriculum on Learn and public feature guides without an account.",
  },
  {
    question: "I searched shel, sheld, or my shel — is that Shelf?",
    answer:
      "Yes. Common misspellings and short forms — shel, sheld, shef, shellf, shlef, myshelf, shelflib, my shel — refer to Shelf at myshelflib.com, the personal study library app.",
  },
] as const;

/** Single crawl-only paragraph listing aliases (not for visible UI). */
export function brandSeoAliasParagraph(): string {
  return `${BRAND_NAME} (official site ${BRAND_DOMAIN}) is also known as: ${BRAND_KEYWORDS.join(", ")}.`;
}
