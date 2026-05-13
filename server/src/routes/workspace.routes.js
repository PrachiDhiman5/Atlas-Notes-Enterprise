import { Router } from "express";
import {
  acceptWorkspaceInvite,
  createWorkspace,
  declineWorkspaceInvite,
  inviteMember,
  listWorkspaces,
  updateMemberRole
} from "../controllers/workspace.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireWorkspaceRole } from "../middleware/workspace.middleware.js";

const router = Router();

router.use(requireAuth);
router.post("/invites/:inviteId/accept", acceptWorkspaceInvite);
router.post("/invites/:inviteId/decline", declineWorkspaceInvite);
router.post("/", createWorkspace);
router.get("/", listWorkspaces);
router.post("/:id/invite", requireWorkspaceRole("owner", "admin"), inviteMember);
router.patch("/:id/members/:userId/role", requireWorkspaceRole("owner"), updateMemberRole);

export default router;
