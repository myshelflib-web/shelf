import type { BlogSection } from "../types";
import { BLOG_EXPANSIONS_A } from "./partA";
import { BLOG_EXPANSIONS_B } from "./partB";
import { BLOG_EXPANSIONS_C } from "./partC";

/** Extra sections merged into every post at read time (static + API). */
export const BLOG_EXPANSIONS: Record<string, BlogSection[]> = {
  ...BLOG_EXPANSIONS_A,
  ...BLOG_EXPANSIONS_B,
  ...BLOG_EXPANSIONS_C,
};
