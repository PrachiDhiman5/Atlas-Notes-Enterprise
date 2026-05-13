import { Router } from "express";
import adminRoutes from "./admin.routes.js";
import analyticsRoutes from "./analytics.routes.js";
import authRoutes from "./auth.routes.js";
import commentRoutes from "./comment.routes.js";
import noteRoutes from "./note.routes.js";
import notificationRoutes from "./notification.routes.js";
import uploadRoutes from "./upload.routes.js";
import workspaceRoutes from "./workspace.routes.js";

const router = Router();

router.get("/health", (req, res) => {
  res.status(200).json({ success: true, message: "API healthy" });
});

router.use("/auth", authRoutes);
router.use("/notes", noteRoutes);
router.use("/workspaces", workspaceRoutes);
router.use("/uploads", uploadRoutes);
router.use("/comments", commentRoutes);
router.use("/notifications", notificationRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/admin", adminRoutes);

export default router;
