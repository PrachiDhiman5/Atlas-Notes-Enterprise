import { Router } from "express";
import { addComment, getComments } from "../controllers/comment.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth);
router.get("/note/:noteId", getComments);
router.post("/note/:noteId", addComment);

export default router;
