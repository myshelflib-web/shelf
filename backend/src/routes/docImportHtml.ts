import { Router, Request, Response } from "express";
import multer from "multer";
import { authMiddleware } from "../middleware/auth.js";
import {
  ALLOWED_UPLOAD_HINT,
  DOCUMENT_MAX_BYTES,
  PDF_IMPORT_MAX_BYTES,
  bufferToHtml,
  detectFileKind,
  textToHtml,
  validateUploadBuffer,
} from "../utils/contentFiles.js";
import {
  extractRelevancyText,
  titleFromFilename,
} from "../utils/relevancyExtract.js";

const router = Router();
router.use(authMiddleware);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: DOCUMENT_MAX_BYTES },
});

/** Convert an uploaded PDF/TXT/MD/DOCX into HTML for pasting into a live Doc. */
router.post(
  "/docs/import-html",
  upload.single("file"),
  async (req: Request, res: Response) => {
    const file = req.file;
    if (!file?.buffer?.length) {
      res.status(400).json({ error: "file required" });
      return;
    }

    const name = file.originalname || "document";
    const mime = file.mimetype || "";
    const kind = detectFileKind(name, mime);
    if (!kind) {
      res.status(400).json({ error: ALLOWED_UPLOAD_HINT });
      return;
    }

    if (kind === "pdf" && file.buffer.length > PDF_IMPORT_MAX_BYTES) {
      res.status(400).json({
        error: `PDF is too large to import (max ${Math.floor(PDF_IMPORT_MAX_BYTES / (1024 * 1024))}MB)`,
      });
      return;
    }

    const invalid = validateUploadBuffer(kind, file.buffer);
    if (invalid) {
      res.status(400).json({ error: invalid });
      return;
    }

    const title = titleFromFilename(name);
    try {
      let html: string;
      if (kind === "pdf") {
        const text = await extractRelevancyText(file.buffer, name, mime);
        html = textToHtml(text, title);
      } else {
        html = await bufferToHtml(file.buffer, kind, title);
      }
      res.json({ html, title, kind });
    } catch (err) {
      res.status(400).json({
        error: err instanceof Error ? err.message : "Import failed",
      });
    }
  }
);

export default router;
