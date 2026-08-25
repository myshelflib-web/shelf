export const BLOG_ROOT = "blog/posts";

export function blogContentKey(slug: string): string {
  return `${BLOG_ROOT}/${slug}/content.json`;
}

export function blogCoverKey(slug: string, ext: string): string {
  return `${BLOG_ROOT}/${slug}/cover.${ext}`;
}

export function blogHeroKey(slug: string): string {
  return `${BLOG_ROOT}/${slug}/hero.svg`;
}

export function blogSectionIllustrationKey(
  slug: string,
  sectionIndex: number
): string {
  return `${BLOG_ROOT}/${slug}/sections/${sectionIndex}.svg`;
}

export function isSafeBlogMediaKey(key: string): boolean {
  if (!key.startsWith(`${BLOG_ROOT}/`)) return false;
  if (key.includes("..") || key.includes("\\")) return false;
  return true;
}

export function coverExtFromMime(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return "jpg";
}
