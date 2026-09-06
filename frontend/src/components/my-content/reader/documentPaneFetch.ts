import { api, ApiError } from "@/lib/api";
import { resolvePreloadedLearnPage } from "@/lib/preloadedLearnPage";
import type { UserContentType } from "@/types";
import type { PersonalPageReaderScope } from "./types";

type NavItem = { slug: string; title: string } | null;

export interface LoadedPage {
  id: string;
  title: string;
  content: string;
  contentType: UserContentType;
  sourceUrl?: string | null;
  completed: boolean;
  starred: boolean;
  readPercent: number;
  navigation: { prev: NavItem; next: NavItem };
  notebookSlug: string | null;
  topicSlug: string | null;
  notebookMeta: { name: string; slug: string; icon: string } | null;
  topicMeta: { title: string; slug: string } | null;
  isPreloaded?: boolean;
  isLocked?: boolean;
  saveAllowed?: boolean;
  saveReason?: string | null;
  saveMode?: "copy_admin" | "download_remote" | "link" | "none";
  embeddable?: boolean | null;
  linkStatus?: string | null;
  sourceLicense?: import("@/types").IngestLicense | null;
  subjectMeta?: { name: string; slug: string; icon?: string | null } | null;
  /** Present when opened via share / link. */
  access?: import("@/types").PageAccessInfo;
  accessDenied?: boolean;
}

export type FetchPageResult = {
  page: import("@/types").UserPageDetail;
  navigation: { prev: NavItem; next: NavItem };
  isPreloaded?: boolean;
  isLocked?: boolean;
  saveAllowed?: boolean;
  saveReason?: string | null;
  saveMode?: "copy_admin" | "download_remote" | "link" | "none";
  embeddable?: boolean | null;
  linkStatus?: string | null;
  sourceLicense?: import("@/types").IngestLicense | null;
  subjectMeta?: { name: string; slug: string; icon?: string | null } | null;
  topicMeta?: { title: string; slug: string } | null;
  access?: import("@/types").PageAccessInfo;
  accessDenied?: boolean;
};

async function fetchCurriculumPage(
  scope: Extract<PersonalPageReaderScope, { kind: "learn" }>
) {
  const res = await api.subjects.getArticle(
    scope.subjectSlug,
    scope.topicSlug,
    scope.articleSlug
  );
  const { article, progress, starred, navigation } = res;
  const resolved = resolvePreloadedLearnPage(article);
  return {
    page: {
      id: article.id,
      title: article.title,
      content: resolved.content,
      contentType: resolved.contentType,
      sourceUrl: resolved.sourceUrl,
      completed: progress.completed ?? false,
      starred,
      readPercent: progress.readPercent ?? 0,
    },
    navigation: {
      prev: navigation.prev,
      next: navigation.next,
    },
    isPreloaded: true as const,
    isLocked: article.isLocked,
    saveAllowed: article.saveAllowed !== false,
    saveReason: article.saveReason ?? null,
    saveMode: article.saveMode ?? "link",
    embeddable: article.embeddable ?? null,
    linkStatus: article.linkStatus ?? null,
    sourceLicense: article.sourceLicense ?? null,
    subjectMeta: article.topic.subject,
    topicMeta: { title: article.topic.title, slug: article.topic.slug },
  };
}

async function fetchPersonalById(
  pageId: string,
  linkToken?: string
): Promise<FetchPageResult> {
  const res = await api.myContent.getPageById(pageId, linkToken);
  return {
    page: res.page,
    navigation: res.navigation,
    access: res.access,
  };
}

/**
 * Load reader content. When `pageId` is known for a personal page, prefer id
 * lookup so open tabs survive explorer moves (path slug becomes stale).
 */
export async function fetchDocumentPage(
  scope: PersonalPageReaderScope,
  pageId?: string | null
): Promise<FetchPageResult> {
  if (scope.kind === "learn") {
    const curriculum = await fetchCurriculumPage(scope);
    return {
      page: curriculum.page as import("@/types").UserPageDetail,
      navigation: curriculum.navigation,
      isPreloaded: true,
      isLocked: curriculum.isLocked,
      saveAllowed: curriculum.saveAllowed,
      saveReason: curriculum.saveReason,
      saveMode: curriculum.saveMode,
      embeddable: curriculum.embeddable,
      linkStatus: curriculum.linkStatus,
      sourceLicense: curriculum.sourceLicense,
      subjectMeta: curriculum.subjectMeta,
      topicMeta: curriculum.topicMeta,
    };
  }
  if (scope.kind === "shared") {
    try {
      return await fetchPersonalById(scope.pageId, scope.linkToken);
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        return {
          page: {
            id: scope.pageId,
            title: "Access removed",
            slug: "access-removed",
            content: "",
            status: "DRAFT",
            contentType: "HTML",
            hasPdf: false,
            completed: false,
            readPercent: 0,
            starred: false,
            isPersonal: true,
            notebook: null,
            topic: null,
          },
          navigation: { prev: null, next: null },
          accessDenied: true,
        };
      }
      throw err;
    }
  }

  if (pageId) {
    try {
      return await fetchPersonalById(pageId);
    } catch {
      /* fall through to path lookup */
    }
  }

  if (scope.kind === "root-file") {
    return api.myContent.getRootPage(scope.pageSlug);
  }
  if (scope.kind === "notebook-file") {
    return api.myContent.getNotebookFilePage(
      scope.notebookSlug,
      scope.pageSlug
    );
  }
  return api.myContent.getPage(
    scope.notebookSlug,
    scope.topicSlug,
    scope.pageSlug
  );
}
