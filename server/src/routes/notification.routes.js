import { Router } from "express";
import { deleteNotification, listNotifications, markNotificationRead } from "../controllers/notification.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth);
router.get("/", listNotifications);
router.patch("/:id/read", markNotificationRead);
router.delete("/:id", deleteNotification);

export default router;
