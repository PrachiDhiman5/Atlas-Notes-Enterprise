import { Workspace } from "../models/Workspace.js";

export const requireWorkspaceRole = (...roles) => async (req, res, next) => {
  const workspaceId = req.params.id || req.body.workspace || req.query.workspace;
  if (!workspaceId) {
    return res.status(400).json({ success: false, message: "Workspace id is required" });
  }

  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) {
    return res.status(404).json({ success: false, message: "Workspace not found" });
  }

  const member = workspace.members.find((m) => m.user.toString() === req.user.id.toString());
  if (!member || !roles.includes(member.role)) {
    return res.status(403).json({ success: false, message: "Insufficient workspace permissions" });
  }

  req.workspace = workspace;
  return next();
};
