import { ActivityLog } from "../models/ActivityLog.js";
import { getIO } from "../config/socket.js";

export const logWorkspaceActivity = async ({ actorId, workspaceId, action, targetType, targetId, metadata }) => {
  const entry = await ActivityLog.create({
    actor: actorId,
    workspace: workspaceId,
    action,
    targetType,
    targetId,
    metadata: metadata || {}
  });
  try {
    getIO().to(`workspace:${workspaceId}`).emit("activity:logged", {
      action,
      targetType,
      targetId: String(targetId)
    });
  } catch {
    /* socket not ready */
  }
  return entry;
};
