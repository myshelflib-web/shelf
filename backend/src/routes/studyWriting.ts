import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/auth.js";
import { QuotaError } from "../utils/quotas.js";
import { assertLlmBudget, chargeLlmTokens } from "../utils/llmUsage.js";
import { reqLog } from "../utils/flowLog.js";
import {
  checkLibraryOverlap,
  checkSyllabusOverlap,
  webOriginalityStub,
  type OriginalityReport,
} from "../services/originalityCheck.js";
import {
  detectAiWritingHeuristic,
  paraphraseText,
  type ParaphraseStyle,
} from "../services/writingAssist.js";
import {
  researchAssist,
  type ResearchAssistKind,
} from "../services/researchAssist.js";

const router = Router();
router.use(authMiddleware);

const STYLES = new Set<ParaphraseStyle>([
  "paraphrase",
  "simplify",
  "formal",
  "shorten",
]);

const RESEARCH_KINDS = new Set<ResearchAssistKind>([
  "tighten_abstract",
  "check_claims",
]);

function readText(body: unknown): string {
  if (!body || typeof body !== "object") return "";
  return String((body as { text?: string }).text ?? "").trim();
}

router.post("/paraphrase", async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const text = readText(req.body);
  const styleRaw = String(
    (req.body as { style?: string }).style ?? "paraphrase"
  ).trim() as ParaphraseStyle;
  const style = STYLES.has(styleRaw) ? styleRaw : "paraphrase";

  if (text.length < 12) {
    res.status(400).json({ error: "text too short" });
    return;
  }

  try {
    await assertLlmBudget(userId, 1);
    const result = await paraphraseText(userId, text, style);
    await chargeLlmTokens(userId, result.tokens);
    reqLog(req).info("study.paraphrase.ok", {
      style: result.style,
      variants: result.variants.length,
      tokens: result.tokens,
    });
    res.json(result);
  } catch (err) {
    if (err instanceof QuotaError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    reqLog(req).error("study.paraphrase.failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    res.status(500).json({
      error:
        err instanceof Error ? err.message : "Paraphrase failed. Try again.",
    });
  }
});

router.post("/originality", async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const text = readText(req.body);
  const excludePageId = String(
    (req.body as { excludePageId?: string }).excludePageId ?? ""
  ).trim() || null;
  const includeAi = Boolean(
    (req.body as { includeAiHeuristic?: boolean }).includeAiHeuristic
  );

  if (text.length < 24) {
    res.status(400).json({ error: "text too short" });
    return;
  }

  try {
    const [library, syllabus, web] = await Promise.all([
      checkLibraryOverlap(userId, text, { excludePageId }),
      checkSyllabusOverlap(userId, text),
      webOriginalityStub(userId),
    ]);

    const report: OriginalityReport = { library, syllabus, web };

    if (includeAi) {
      await assertLlmBudget(userId, 1);
      const { tokens, ...aiHeuristic } = await detectAiWritingHeuristic(
        userId,
        text
      );
      if (tokens > 0) await chargeLlmTokens(userId, tokens);
      report.aiHeuristic = aiHeuristic;
    }

    reqLog(req).info("study.originality.ok", {
      libraryMatches: library.matches.length,
      syllabusOverlaps: syllabus.overlaps.length,
      web: web.status,
      ai: includeAi,
    });
    res.json(report);
  } catch (err) {
    if (err instanceof QuotaError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    reqLog(req).error("study.originality.failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    res.status(500).json({
      error:
        err instanceof Error
          ? err.message
          : "Originality check failed. Try again.",
    });
  }
});

router.post("/research-assist", async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const text = readText(req.body);
  const kindRaw = String(
    (req.body as { kind?: string }).kind ?? "tighten_abstract"
  ).trim() as ResearchAssistKind;
  const kind = RESEARCH_KINDS.has(kindRaw) ? kindRaw : "tighten_abstract";
  const maxWords = Number((req.body as { maxWords?: number }).maxWords) || 150;
  const bibKeys = Array.isArray((req.body as { bibKeys?: unknown }).bibKeys)
    ? ((req.body as { bibKeys: unknown[] }).bibKeys.map((k) => String(k)))
    : [];

  if (text.length < 20) {
    res.status(400).json({ error: "text too short" });
    return;
  }

  try {
    await assertLlmBudget(userId, 1);
    const result = await researchAssist(userId, kind, text, {
      maxWords,
      bibKeys,
    });
    await chargeLlmTokens(userId, result.tokens);
    reqLog(req).info("study.research_assist.ok", {
      kind: result.kind,
      tokens: result.tokens,
    });
    res.json(result);
  } catch (err) {
    if (err instanceof QuotaError) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    reqLog(req).error("study.research_assist.failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    res.status(500).json({
      error:
        err instanceof Error
          ? err.message
          : "Research assist failed. Try again.",
    });
  }
});

export default router;
