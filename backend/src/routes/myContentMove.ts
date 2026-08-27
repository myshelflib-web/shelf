import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { param } from "../utils/param.js";
import { errorFields } from "../utils/logger.js";
import {
  moveLibraryPage,
  moveLibraryTopicGroup,
} from "../utils/libraryMove.js";

const router = Router();
router.use(authMiddleware);

router.patch("/pages/:id/move", async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const body = req.body as {
      subjectId?: string | null;
      topicGroupId?: string | null;
      beforePageId?: string | null;
    };

    const subjectId =
      body.subjectId === undefined ? null : body.subjectId;
    const topicGroupId =
      body.topicGroupId === undefined ? null : body.topicGroupId;
    const beforePageId =
      body.beforePageId === undefined ? null : body.beforePageId;

    const result = await moveLibraryPage(userId, param(req, "id"), {
      subjectId,
      topicGroupId,
      beforePageId,
    });

    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not move page";
    const status =
      message === "Page not found" ||
      message === "Collection not found" ||
      message === "Topic not found"
        ? 404
        : message === "Collection required for topic pages"
          ? 400
          : 500;
    if (status === 500) {
      req.log?.error("my_content.page_move_failed", errorFields(err));
    }
    res.status(status).json({ error: message });
  }
});

router.patch(
  "/subjects/:subjectId/topic-groups/:groupId/move",
  async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId;
      const body = req.body as {
        targetSubjectId?: string;
        beforeGroupId?: string | null;
      };

      if (!body.targetSubjectId) {
        res.status(400).json({ error: "targetSubjectId required" });
        return;
      }

      const result = await moveLibraryTopicGroup(
        userId,
        param(req, "subjectId"),
        param(req, "groupId"),
        {
          targetSubjectId: body.targetSubjectId,
          beforeGroupId: body.beforeGroupId ?? null,
        }
      );

      res.json(result);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not move topic";
      const status =
        message.includes("not found") ? 404 : 500;
      if (status === 500) {
        req.log?.error("my_content.topic_move_failed", errorFields(err));
      }
      res.status(status).json({ error: message });
    }
  }
);

export default router;
