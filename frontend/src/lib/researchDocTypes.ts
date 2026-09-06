export type CiteStyle = "apa" | "mla" | "chicago" | "ieee";

export type CitationAuthor = {
  family?: string;
  given?: string;
  literal?: string;
};

export type CitationSource = {
  id: string;
  title: string;
  authors: CitationAuthor[];
  year: string | null;
  doi: string | null;
  url: string | null;
  container: string | null;
  pages: string | null;
  type: string;
  bibtexKey: string | null;
  pageId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CitationInput = {
  title: string;
  authors?: CitationAuthor[];
  year?: string;
  doi?: string;
  url?: string;
  container?: string;
  pages?: string;
  type?: string;
  bibtexKey?: string;
  pageId?: string;
};

export type PageComment = {
  id: string;
  pageId: string;
  userId: string;
  parentId: string | null;
  body: string;
  anchorQuote: string | null;
  resolvedAt: string | null;
  createdAt: string;
  user?: { id: string; name: string; avatarUrl: string | null };
  replies?: PageComment[];
};
