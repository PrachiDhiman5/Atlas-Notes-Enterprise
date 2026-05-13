import { Router } from "express";
import { listUploadsForNote, streamUploadFile, uploadFile } from "../controllers/upload.controller.js";
import { requireAuth, requireAuthFlexible } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";

const router = Router();

router.get("/stream/:id", requireAuthFlexible, streamUploadFile);
router.use(requireAuth);
router.get("/", listUploadsForNote);
router.post("/", upload.single("file"), uploadFile);

export default router;
