import type * as pdfjs from "pdfjs-dist";

export type PdfLoadProgress = {
  loaded: number;
  total: number;
  percent: number;
};

type PdfDocumentSource = Parameters<typeof pdfjs.getDocument>[0];

export function openPdfDocument(
  pdfjsModule: typeof pdfjs,
  src: PdfDocumentSource,
  onProgress?: (progress: PdfLoadProgress) => void
): Promise<pdfjs.PDFDocumentProxy> {
  const task = pdfjsModule.getDocument(src);
  if (onProgress) {
    task.onProgress = ({ loaded, total }) => {
      const percent =
        total > 0 ? Math.min(100, Math.round((loaded / total) * 100)) : 0;
      onProgress({ loaded, total, percent });
    };
  }
  return task.promise;
}
