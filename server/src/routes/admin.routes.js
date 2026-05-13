import { Router } from "express";
import { listAllWorkspaces, listUsers, updateUserRole } from "../controllers/admin.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth, requireRole("admin"));
router.get("/users", listUsers);
router.patch("/users/:id/role", updateUserRole);
router.get("/workspaces", listAllWorkspaces);

export default router;
