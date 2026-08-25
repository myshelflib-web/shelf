export type BlogSection = {
  heading?: string;
  paragraphs: string[];
  bullets?: string[];
  illustrationUrl?: string;
};

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  excerpt: string;
  publishedAt: string;
  updatedAt?: string;
  tags: string[];
  readingMinutes: number;
  coverImageUrl?: string;
  heroIllustrationUrl?: string;
  sections: BlogSection[];
};

export function buildPost(
  meta: Omit<BlogPost, "sections">,
  sections: BlogSection[]
): BlogPost {
  return { ...meta, sections };
}
