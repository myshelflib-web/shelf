import prisma from "../utils/prisma.js";
import { uploadToS3 } from "./s3.js";
import { scheduleIndexPage } from "./libraryIndex.js";
import {
  createNestedFolder,
  createRootFolder,
} from "./libraryStore.js";
import { userDocPrefix, contentHtmlKey, pageHref } from "../utils/docPaths.js";
import {
  nextPageOrder,
  uniquePageSlug,
  type PageSlugScope,
} from "../utils/pageScope.js";
import { QuotaError, assertStorageRoom } from "../utils/quotas.js";
import { userSelect } from "../utils/publicUser.js";
import { canonicalWatchUrl } from "../utils/youtubeUrl.js";
import {
  PLAYLIST_IMPORT_MAX,
  fetchPlaylist,
  fetchVideoTitle,
} from "./youtubeFetch.js";

export const VIDEO_NOTES_HTML =
  `<div class="shelf-doc-editor"><div class="shelf-doc-body"><p><br></p></div></div>`;

const pageSelect = {
  id: true,
  title: true,
  slug: true,
  status: true,
  order: true,
  completed: true,
  starred: true,
  contentType: true,
} as const;

export type YoutubePageParent = {
  userId: string;
  scope: PageSlugScope;
  userSubjectId: string | null;
  userTopicGroupId: string | null;
  subjectSlug: string | null;
  groupSlug: string | null;
};

export type YoutubeImportPage = {
  id: string;
  title: string;
  slug: string;
  status: string;
  order: number;
  completed: boolean;
  starred: boolean;
  contentType: "VIDEO";
};

export type YoutubeImportResult = {
  kind: "video" | "playlist";
  page: YoutubeImportPage;
  pages: YoutubeImportPage[];
  href: string;
  notebook: { id: string; name: string; slug: string } | null;
  topic: { id: string; title: string; slug: string } | null;
  importedCount: number;
  truncated: boolean;
  playlistTitle: string | null;
};

async function chargeStorage(userId: string, extraBytes: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: userSelect,
  });
  if (!user) throw new QuotaError("User not found");
  assertStorageRoom(user, extraBytes);
  await prisma.user.update({
    where: { id: userId },
    data: { storageUsedBytes: { increment: BigInt(extraBytes) } },
  });
}

export async function createVideoPage(input: {
  parent: YoutubePageParent;
  title: string;
  videoId: string;
  playlistId?: string;
  order?: number;
}): Promise<YoutubeImportPage> {
  const title = input.title.trim() || "YouTube video";
  const slug = await uniquePageSlug(input.parent.scope, title);
  const order = input.order ?? (await nextPageOrder(input.parent.scope));
  const html = VIDEO_NOTES_HTML;
  const htmlBytes = Buffer.byteLength(html, "utf8");
  await chargeStorage(input.parent.userId, htmlBytes);

  const contentKey = contentHtmlKey(
    userDocPrefix(
      input.parent.userId,
      input.parent.subjectSlug,
      input.parent.groupSlug,
      slug
    )
  );
  await uploadToS3(contentKey, html, "text/html");

  const page = await prisma.userTopic.create({
    data: {
      userId: input.parent.userId,
      folderId:
        input.parent.userTopicGroupId ?? input.parent.userSubjectId ?? null,
      userSubjectId: null,
      userTopicGroupId: null,
      title,
      slug,
      sourceUrl: canonicalWatchUrl(input.videoId, input.playlistId),
      contentUrl: contentKey,
      contentType: "VIDEO",
      fileSizeBytes: htmlBytes,
      status: "PUBLISHED",
      order,
    },
    select: pageSelect,
  });
  scheduleIndexPage(page.id);
  return { ...page, contentType: "VIDEO" };
}

async function importVideosIntoParent(
  parent: YoutubePageParent,
  videos: Array<{ videoId: string; title: string }>,
  playlistId: string
): Promise<YoutubeImportPage[]> {
  const startOrder = await nextPageOrder(parent.scope);
  const pages: YoutubeImportPage[] = [];
  for (let i = 0; i < videos.length; i++) {
    const video = videos[i];
    pages.push(
      await createVideoPage({
        parent,
        title: video.title,
        videoId: video.videoId,
        playlistId,
        order: startOrder + i,
      })
    );
  }
  return pages;
}

export async function importYoutube(input: {
  parent: YoutubePageParent;
  title?: string;
  target: import("../utils/youtubeUrl.js").YoutubeTarget;
}): Promise<YoutubeImportResult> {
  const { parent, target } = input;
  const customTitle = input.title?.trim() || "";

  if (target.kind === "video") {
    const title = customTitle || (await fetchVideoTitle(target.videoId));
    const page = await createVideoPage({
      parent,
      title,
      videoId: target.videoId,
      playlistId: target.playlistId,
    });
    return {
      kind: "video",
      page,
      pages: [page],
      href: pageHref(parent.subjectSlug, parent.groupSlug, page.slug),
      notebook: parent.userSubjectId
        ? {
            id: parent.userSubjectId,
            name: "",
            slug: parent.subjectSlug ?? "",
          }
        : null,
      topic: parent.userTopicGroupId
        ? {
            id: parent.userTopicGroupId,
            title: "",
            slug: parent.groupSlug ?? "",
          }
        : null,
      importedCount: 1,
      truncated: false,
      playlistTitle: null,
    };
  }

  const playlist = await fetchPlaylist(target.playlistId);
  const folderTitle = customTitle || playlist.title || "YouTube playlist";
  const videos = playlist.videos.slice(0, PLAYLIST_IMPORT_MAX);
  if (videos.length === 0) {
    throw new Error("That playlist has no public videos Shelf can import.");
  }

  let dest = parent;
  let notebook: YoutubeImportResult["notebook"] = parent.userSubjectId
    ? { id: parent.userSubjectId, name: "", slug: parent.subjectSlug ?? "" }
    : null;
  let topic: YoutubeImportResult["topic"] = parent.userTopicGroupId
    ? { id: parent.userTopicGroupId, title: "", slug: parent.groupSlug ?? "" }
    : null;

  if (!parent.userSubjectId) {
    const folder = await createRootFolder(parent.userId, {
      name: folderTitle.slice(0, 120),
    });
    dest = {
      userId: parent.userId,
      scope: { kind: "notebook", userSubjectId: folder.id },
      userSubjectId: folder.id,
      userTopicGroupId: null,
      subjectSlug: folder.slug,
      groupSlug: null,
    };
    notebook = { id: folder.id, name: folder.name, slug: folder.slug };
    topic = null;
  } else if (!parent.userTopicGroupId) {
    const group = await createNestedFolder(parent.userId, parent.userSubjectId, {
      name: folderTitle.slice(0, 120),
    });
    if (!group) {
      throw new Error("Collection not found");
    }
    dest = {
      userId: parent.userId,
      scope: { kind: "topic", userTopicGroupId: group.id },
      userSubjectId: parent.userSubjectId,
      userTopicGroupId: group.id,
      subjectSlug: parent.subjectSlug,
      groupSlug: group.slug,
    };
    topic = { id: group.id, title: group.name, slug: group.slug };
  }

  const pages = await importVideosIntoParent(dest, videos, target.playlistId);
  const page = pages[0];
  return {
    kind: "playlist",
    page,
    pages,
    href: pageHref(dest.subjectSlug, dest.groupSlug, page.slug),
    notebook,
    topic,
    importedCount: pages.length,
    truncated: playlist.truncated,
    playlistTitle: folderTitle,
  };
}
