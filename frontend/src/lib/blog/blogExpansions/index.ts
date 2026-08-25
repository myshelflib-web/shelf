import type { BlogSection } from "../types";
import { BLOG_EXPANSIONS_A } from "./partA";
import { BLOG_EXPANSIONS_B } from "./partB";

/** Extra sections merged into every post at read time (static + API). */
export const BLOG_EXPANSIONS: Record<string, BlogSection[]> = {
  ...BLOG_EXPANSIONS_A,
  ...BLOG_EXPANSIONS_B,
};
