import type { Request, Response, Router } from "express";
import { getObjectBuffer } from "../services/s3.js";
import { isPublicLearnSubject } from "../services/contentGen/publicLearnSubject.js";
import { adminDocPrefix } from "../utils/docPaths.js";
import { param } from "../utils/param.js";

const FIGURE_NAME = /^figure-\d+\.(jpe?g|webp|png)$/i;

/** Streams CC photo bytes stored beside generated content.html. */
export function registerSubjectArticleMediaRoutes(router: Router): void {
  router.get(
    "/:subjectSlug/topics/:topicSlug/articles/:articleSlug/media/:filename",
    async (req: Request, res: Response) => {
      const subjectSlug = param(req, "subjectSlug");
      const topicSlug = param(req, "topicSlug");
      const articleSlug = param(req, "articleSlug");
      const filename = param(req, "filename");

      if (!isPublicLearnSubject(subjectSlug)) {
        res.status(404).json({ error: "Not found" });
        return;
      }
      if (!FIGURE_NAME.test(filename)) {
        res.status(400).json({ error: "Invalid media filename" });
        return;
      }

      const key = `${adminDocPrefix(subjectSlug, topicSlug, articleSlug)}/figures/${filename}`;
      try {
        const { buffer, contentType } = await getObjectBuffer(key);
        res.setHeader("Content-Type", contentType);
        res.setHeader("Cache-Control", "public, max-age=86400, immutable");
        res.send(buffer);
      } catch {
        res.status(404).json({ error: "Media not found" });
      }
    }
  );
}
