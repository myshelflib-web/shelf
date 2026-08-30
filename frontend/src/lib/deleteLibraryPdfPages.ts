import { api } from "@/lib/api";
import { peekCachedPdf, removeCachedPdf } from "@/lib/pdfByteCache";
import { removePdfPages } from "@/lib/removePdfPages";
import {
  countPdfDeleteUndos,
  popPdfDeleteUndo,
  pushPdfDeleteUndo,
} from "@/lib/pdfDeleteUndo";
import type { UserContentHighlight } from "@/types";

function blobFromBytes(bytes: ArrayBuffer | Uint8Array): Blob {
  const src =
    bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const copy = new Uint8Array(src.byteLength);
  copy.set(src);
  return new Blob([copy], { type: "application/pdf" });
}

export async function deleteLibraryPdfPages(opts: {
  pageId: string;
  deletedPages: number[];
  numPagesBefore: number;
  highlightsBefore: UserContentHighlight[];
  viewPdfPage: number;
}): Promise<{ highlights: UserContentHighlight[]; undoCount: number }> {
  const {
    pageId,
    deletedPages,
    numPagesBefore,
    highlightsBefore,
    viewPdfPage,
  } = opts;
  const peeked = await peekCachedPdf(pageId);
  const bytes = peeked
    ? peeked.data.slice(0)
    : await api.myContent.getPdfBlob(pageId).then((blob) => blob.arrayBuffer());

  await pushPdfDeleteUndo({
    pageId,
    deletedPages,
    viewPdfPage,
    pdfBytes: bytes.slice(0),
    highlights: highlightsBefore,
  });

  try {
    const next = await removePdfPages(bytes, deletedPages);
    const file = blobFromBytes(next);
    const result = await api.myContent.replacePdfPages(pageId, file, {
      deletedPages,
      numPagesBefore,
    });
    await removeCachedPdf(pageId);
    const undoCount = await countPdfDeleteUndos(pageId);
    return { highlights: result.highlights, undoCount };
  } catch (err) {
    await popPdfDeleteUndo(pageId);
    throw err;
  }
}

export async function undoLibraryPdfPageDelete(opts: {
  pageId: string;
}): Promise<{
  highlights: UserContentHighlight[];
  viewPdfPage: number;
  undoCount: number;
} | null> {
  const entry = await popPdfDeleteUndo(opts.pageId);
  if (!entry) return null;

  try {
    const file = blobFromBytes(entry.pdfBytes);
    const result = await api.myContent.restorePdfPages(opts.pageId, file, {
      highlights: entry.highlights,
      viewPdfPage: entry.viewPdfPage,
    });
    await removeCachedPdf(opts.pageId);
    const undoCount = await countPdfDeleteUndos(opts.pageId);
    return {
      highlights: result.highlights,
      viewPdfPage: entry.viewPdfPage,
      undoCount,
    };
  } catch (err) {
    await pushPdfDeleteUndo(entry);
    throw err;
  }
}
