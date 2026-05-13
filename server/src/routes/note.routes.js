import { Router } from "express";
import {
  createNote,
  deleteNote,
  getNoteById,
  getNotes,
  listVersions,
  restoreVersion,
  updateNote
} from "../controllers/note.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth);
router.post("/", createNote);
router.get("/", getNotes);
router.get("/:id", getNoteById);
router.patch("/:id", updateNote);
router.delete("/:id", deleteNote);
router.get("/:id/versions", listVersions);
router.post("/:id/versions/:versionId/restore", restoreVersion);

export default router;
