import { Router } from "express";
import { getAnalyticsOverview, getMyActivityFeed } from "../controllers/analytics.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.get("/overview", requireAuth, getAnalyticsOverview);
router.get("/activity", requireAuth, getMyActivityFeed);

export default router;
