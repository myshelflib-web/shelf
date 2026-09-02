export type StudyGoal =
  | "GENERAL"
  | "UPSC"
  | "STATE_PCS"
  | "JUDICIARY"
  | "CA"
  | "NEET_PG"
  | "GATE";

export type StudyItemKind = "TASK" | "EVENT";

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatarUrl?: string | null;
  plan?: string;
  subscriptionExpiresAt?: string | null;
  studyGoal?: StudyGoal;
  hasPassword?: boolean;
  isPremium?: boolean;
  storageUsedBytes?: number;
  storageLimitBytes?: number;
  llmTokensUsed?: number;
  llmTokenLimit?: number;
  vectorChunksUsed?: number;
  vectorChunkLimit?: number;
  coinBalance?: number;
  telegramLinked?: boolean;
  telegramUsername?: string | null;
  createdAt?: string;
}

export interface ArticleSummary {
  id: string;
  title: string;
  slug: string;
  order: number;
  isPremium?: boolean;
}

export interface Topic {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  order: number;
  articles?: ArticleSummary[];
  isPremium?: boolean;
}

export interface Subject {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  order: number;
  studyGoal?: StudyGoal;
  topics: Topic[];
}

export interface TopicDetail {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  subject: { name: string; slug: string; icon?: string };
  articles: ArticleSummary[];
}

export interface ArticleDetail {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  contentUrl: string | null;
  hasPdf?: boolean;
  sourceUrl?: string | null;
  saveAllowed?: boolean;
  saveMode?: "copy_admin" | "download_remote" | "link" | "none";
  saveReason?: string | null;
  embeddable?: boolean | null;
  linkStatus?: string | null;
  sourceLicense?: import("@/types").IngestLicense | null;
  summary?: string | null;
  isPremium: boolean;
  isLocked: boolean;
  previewPercent: number;
  topic: {
    title: string;
    slug: string;
    subject: { name: string; slug: string; icon?: string };
  };
}

export interface Highlight {
  id: string;
  articleId: string;
  text: string;
  startOffset: number;
  endOffset: number;
  color: string;
  note?: string | null;
}

export interface Progress {
  completed: boolean;
  readPercent: number;
}

export interface SubjectProgress {
  subjectId: string;
  slug: string;
  name: string;
  completed: number;
  total: number;
}

export interface AdminArticle {
  id: string;
  title: string;
  slug: string;
  status: string;
  order: number;
  isPremium?: boolean;
  previewPercent?: number;
  pdfKey?: string | null;
  createdAt?: string;
  updatedAt?: string;
  subject: { name: string; slug: string };
  topic: { title: string; slug: string };
}

/** @deprecated Use AdminArticle */
export type AdminTopic = AdminArticle;

export interface AdminStats {
  totalTopics: number;
  published: number;
  processing: number;
  failed: number;
  draft: number;
  subjects: number;
}

export type NotebookSort =
  | "recent"
  | "oldest"
  | "name"
  | "nameDesc"
  | "pages"
  | "order";
export type NotebookFilter =
  | "all"
  | "with-pages"
  | "empty"
  | "pdf"
  | "link"
  | "starred";

export interface UserSubject {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon: string;
  order: number;
  topicGroups: UserTopicGroup[];
  /** Pages attached to the collection without a topic */
  pages?: UserPageSummary[];
  /** @deprecated use topicGroups */
  topics?: UserPageSummary[];
}

export interface UserTopicGroup {
  id: string;
  title: string;
  slug: string;
  order: number;
  pages: UserPageSummary[];
}

export type UserContentType =
  | "PDF"
  | "HTML"
  | "MARKDOWN"
  | "TEXT"
  | "DOCX"
  | "LINK"
  | "VIDEO";

export interface UserPageSummary {
  id: string;
  title: string;
  slug: string;
  status: string;
  order: number;
  completed?: boolean;
  starred?: boolean;
  contentType?: UserContentType;
}

/** @deprecated use UserPageSummary */
export type UserTopicSummary = UserPageSummary;

export interface UserPageDetail {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  status: string;
  contentType: UserContentType;
  sourceUrl?: string | null;
  hasPdf: boolean;
  completed: boolean;
  readPercent: number;
  starred: boolean;
  isPersonal: boolean;
  shared?: boolean;
  notebook: { name: string; slug: string; icon: string } | null;
  topic: { title: string; slug: string } | null;
  view?: {
    pdfPage?: number | null;
    pageOffset?: number | null;
    scrollTop?: number | null;
    scale?: number | null;
    viewedAt?: string | null;
  } | null;
}

export type PageAccessInfo = {
  role: "owner" | "view" | "edit";
  canEdit: boolean;
  canAnnotate: boolean;
  canManageShares: boolean;
  isOwner: boolean;
  owner: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
  };
  linkShareEnabled: boolean;
  linkToken: string | null;
  viewerId: string;
};

/** @deprecated */
export type UserTopicDetail = UserPageDetail;

export interface UserContentHighlight {
  id: string;
  userTopicId: string;
  text: string;
  startOffset: number;
  endOffset: number;
  color: string;
  note?: string | null;
  kind?: "TEXT" | "REGION";
  pageNumber?: number | null;
  position?: {
    rects?: Array<{ x: number; y: number; w: number; h: number }>;
    type?: "pen";
    tool?: "ink" | "highlight";
    color?: string;
    points?: Array<{ x: number; y: number }>;
    width?: number;
    opacity?: number;
  } | null;
}

export interface StudyTask {
  id: string;
  title: string;
  notes?: string | null;
  kind?: StudyItemKind;
  dueAt: string | null;
  endsAt?: string | null;
  completed: boolean;
  articleId?: string | null;
  href?: string | null;
  recurrence?: "NONE" | "DAILY" | "WEEKLY" | "MONTHLY";
  recurUntil?: string | null;
  seriesId?: string;
  seriesStart?: string;
  article?: {
    id: string;
    title: string;
    slug: string;
    topic: {
      slug: string;
      title: string;
      subject: { slug: string; name: string };
    };
  } | null;
}

export interface LibraryCitation {
  n: number;
  pageId: string;
  title: string;
  notebook: string;
  topic: string;
  href: string;
  quote: string;
}

export interface StudyRelevancyDocSummary {
  id: string;
  title: string;
  source: string;
  originalFilename?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StudyRelevancyDoc extends StudyRelevancyDocSummary {
  body: string;
}

export type ChatContextKind = "LIBRARY" | "NOTEBOOK" | "TOPIC" | "PAGE";

export interface ChatThreadSummary {
  id: string;
  title: string;
  contextKind?: ChatContextKind | string;
  contextNotebookId?: string | null;
  contextTopicId?: string | null;
  contextPageId?: string | null;
  relevancyDocId?: string | null;
  relevancyDoc?: StudyRelevancyDocSummary | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  threadId: string;
  role: "user" | "assistant" | string;
  content: string;
  citations?: LibraryCitation[] | null;
  createdAt: string;
}

export interface ChatThread extends ChatThreadSummary {
  messages: ChatMessage[];
  memoryLimit?: number;
}

export interface AdminBlogSection {
  heading?: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface AdminBlogPostRow {
  id: string;
  slug: string;
  title: string;
  description: string;
  excerpt: string;
  tags: string[];
  readingMinutes: number;
  status: "DRAFT" | "PUBLISHED";
  coverImageKey?: string | null;
  heroImageKey?: string | null;
  contentKey: string;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminBlogPostDetail extends AdminBlogPostRow {
  content: { sections: AdminBlogSection[] };
  coverImageUrl?: string | null;
  heroIllustrationUrl?: string | null;
}

export type IngestLicense = "GOVERNMENT_PRESS" | "LINK_ONLY" | "OFFICIAL_DOCUMENT";

export interface IngestSourceRow {
  id: string;
  name: string;
  slug: string;
  kind: string;
  feedUrl: string;
  studyGoals: StudyGoal[];
  license: IngestLicense;
  cadence: string;
  enabled: boolean;
  maxItemsPerRun: number;
  promoteToSubjectSlug: string | null;
  promoteToTopicSlug: string | null;
  lastPolledAt: string | null;
  lastSuccessAt: string | null;
  lastError: string | null;
  _count: { items: number };
}

export interface IngestItemRow {
  id: string;
  slug: string;
  title: string;
  canonicalUrl: string;
  shelfSummary: string | null;
  factualExcerpt: string | null;
  license: IngestLicense;
  status: string;
  tags: string[];
  studyGoals: StudyGoal[];
  edition: string | null;
  publishedAt: string | null;
  publishedAtShelf: string | null;
  fetchedAt: string;
  articleId: string | null;
  linkStatus: string;
  embeddable: boolean | null;
  lastHttpStatus: number | null;
  lastLinkCheckAt: string | null;
  source: { name: string; slug: string; license: IngestLicense };
  article: { id: string; slug: string; status: string } | null;
}

export interface IngestJobRow {
  id: string;
  phase: string;
  status: string;
  error: string | null;
  attempts: number;
  createdAt: string;
  completedAt: string | null;
  source: { slug: string; name: string } | null;
  item: { title: string } | null;
}

export type ContentGenStatus =
  | "QUEUED"
  | "RUNNING"
  | "PAUSED"
  | "COMPLETED"
  | "FAILED"
  | "SKIPPED";

export interface ContentGenPackSubject {
  slug: string;
  name: string;
  paper: string | null;
  articleCount: number;
}

export interface ContentGenPack {
  studyGoal: StudyGoal;
  label: string;
  articleCount: number;
  subjects: ContentGenPackSubject[];
}

export interface ContentGenOverview {
  provider: {
    configured: boolean;
    model: string;
    baseUrl: string;
    inputInrPerMtok: number;
    outputInrPerMtok: number;
  };
  packs: ContentGenPack[];
  totalPages: number;
  estimatedCostPaise: number;
  estimatedBytes: number;
  perPageCostPaise: number;
  perPageBytes: number;
  tokensPerPage: { input: number; output: number };
  pipeline: string;
  busy: boolean;
}

export interface ContentGenJobRow {
  id: string;
  kind: "STARTER_PACK" | "NEWS_BRIEF";
  status: ContentGenStatus;
  studyGoal: StudyGoal;
  model: string;
  dryRun: boolean;
  withIllustrations: boolean;
  plannedCount: number;
  completedCount: number;
  failedCount: number;
  skippedCount: number;
  inputTokens: number;
  outputTokens: number;
  costPaise: number;
  error: string | null;
  pausedReason: string | null;
  pausedAt: string | null;
  resumeAttempts: number;
  cursor: number;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
}

export interface ContentGenItemRow {
  id: string;
  title: string;
  slug: string;
  subjectSlug: string;
  topicSlug: string;
  status: ContentGenStatus;
  relevanceScore: number | null;
  reviewNotes: string | null;
  articleId: string | null;
  wordCount: number;
  inputTokens: number;
  outputTokens: number;
  error: string | null;
  hasDraft?: boolean;
}

export interface ContentGenJobDetail extends ContentGenJobRow {
  cursor: number;
}

export interface ContentGenItemsPage {
  items: ContentGenItemRow[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface ContentGenNewsCluster {
  key: string;
  leadTitle: string;
  sourceCount: number;
  sources: string[];
}

export interface CurrentAffairsItem {
  id: string;
  slug: string;
  title: string;
  canonicalUrl: string;
  shelfSummary: string | null;
  factualExcerpt: string | null;
  license: IngestLicense;
  tags: string[];
  studyGoals: StudyGoal[];
  edition: string | null;
  publishedAt: string | null;
  publishedAtShelf: string | null;
  articleId: string | null;
  sharePath: string;
  learnPath: string | null;
  linkStatus: string;
  embeddable: boolean | null;
  source: { name: string; slug: string };
  disclaimer: string;
}
