import { Router, Request, Response } from "express";
import prisma from "../utils/prisma.js";
import { authMiddleware } from "../middleware/auth.js";
import { param } from "../utils/param.js";
import { isReservedSlug } from "../utils/pageScope.js";
import {
  createNestedFolder,
  createRootFolder,
  findFolderForUser,
  loadFolderTree,
  loadRootFiles,
} from "../services/libraryStore.js";
import { fileSelect } from "../services/legacyLibraryTree.js";

const router = Router();
router.use(authMiddleware);

/** Full library tree: folders (any depth) + files. */
router.get("/tree", async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  try {
    const tree = await loadFolderTree(userId);
    res.json(tree);
  } catch {
    res.status(500).json({ error: "Could not load library tree" });
  }
});

router.get("/folders", async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const parentId = req.query.parentId
    ? String(req.query.parentId)
    : null;

  try {
    const folders = await prisma.userFolder.findMany({
      where: { userId, parentId },
      orderBy: [{ order: "asc" }, { name: "asc" }],
    });
    res.json({ folders });
  } catch {
    res.status(500).json({ error: "Could not load folders" });
  }
});

router.post("/folders", async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const name = String(req.body?.name ?? "").trim();
  const parentId = req.body?.parentId ? String(req.body.parentId) : null;
  const description = req.body?.description
    ? String(req.body.description)
    : null;
  const icon = req.body?.icon ? String(req.body.icon) : undefined;

  if (!name) {
    res.status(400).json({ error: "Name is required" });
    return;
  }
  if (isReservedSlug(name)) {
    res.status(400).json({ error: "That folder name is reserved" });
    return;
  }

  try {
    if (parentId) {
      const folder = await createNestedFolder(userId, parentId, { name });
      if (!folder) {
        res.status(404).json({ error: "Parent folder not found" });
        return;
      }
      res.status(201).json({ folder });
      return;
    }

    const folder = await createRootFolder(userId, {
      name,
      description,
      icon,
    });
    res.status(201).json({ folder });
  } catch (err) {
    if (err instanceof Error && err.message === "reserved") {
      res.status(400).json({ error: "That folder name is reserved" });
      return;
    }
    res.status(409).json({ error: "A folder with this name already exists" });
  }
});

router.patch("/folders/:id", async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const id = param(req, "id");
  const folder = await findFolderForUser(userId, id);
  if (!folder) {
    res.status(404).json({ error: "Folder not found" });
    return;
  }

  const name = req.body?.name != null ? String(req.body.name).trim() : undefined;
  const description =
    req.body?.description !== undefined
      ? req.body.description
        ? String(req.body.description).trim()
        : null
      : undefined;

  const updated = await prisma.userFolder.update({
    where: { id },
    data: {
      ...(name ? { name } : {}),
      ...(description !== undefined ? { description } : {}),
    },
  });
  res.json({ folder: updated });
});

router.delete("/folders/:id", async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const id = param(req, "id");
  const folder = await findFolderForUser(userId, id);
  if (!folder) {
    res.status(404).json({ error: "Folder not found" });
    return;
  }
  await prisma.userFolder.delete({ where: { id } });
  res.json({ ok: true });
});

router.get("/files", async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const folderId = req.query.folderId
    ? String(req.query.folderId)
    : null;

  if (!folderId) {
    const files = await loadRootFiles(userId);
    res.json({ files });
    return;
  }

  const folder = await findFolderForUser(userId, folderId);
  if (!folder) {
    res.status(404).json({ error: "Folder not found" });
    return;
  }

  const files = await prisma.userTopic.findMany({
    where: { userId, folderId },
    select: fileSelect,
    orderBy: { order: "asc" },
  });
  res.json({ files });
});

export default router;
