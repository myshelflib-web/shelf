import { Router, Request, Response } from "express";
import { reqLog } from "../utils/flowLog.js";
import { completeScanFromWebhook } from "../services/webOriginalityProvider.js";

const router = Router();

/**
 * Copyleaks posts here with {STATUS} = completed | error | creditsChecked.
 * No auth middleware — vendor callback. scanId is unguessable UUID fragment.
 */
router.post(
  "/webhooks/copyleaks/:status/:scanId",
  async (req: Request, res: Response) => {
    const status = String(req.params.status || "");
    const scanId = String(req.params.scanId || "");
    if (!scanId || scanId.length < 8) {
      res.status(400).json({ error: "bad scanId" });
      return;
    }
    try {
      completeScanFromWebhook(scanId, status, req.body);
      reqLog(req).info("copyleaks.webhook", { status, scanId });
      res.status(200).json({ ok: true });
    } catch (err) {
      reqLog(req).error("copyleaks.webhook.failed", {
        status,
        scanId,
        error: err instanceof Error ? err.message : String(err),
      });
      res.status(500).json({ error: "webhook failed" });
    }
  }
);

export default router;
