import { asyncHandler } from "../utils/asyncHandler.js";
import { Note } from "../models/Note.js";
import { Workspace } from "../models/Workspace.js";
import { FileUpload } from "../models/FileUpload.js";
import { ActivityLog } from "../models/ActivityLog.js";

const getUserWorkspaceIds = async (userId) =>
  Workspace.find({ "members.user": userId }).distinct("_id");

export const getAnalyticsOverview = asyncHandler(async (req, res) => {
  const workspaceIds = await getUserWorkspaceIds(req.user.id);
  const inWs = workspaceIds.length ? { workspace: { $in: workspaceIds } } : { workspace: { $in: [] } };
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [notesCount, workspaceCount, uploadsCount, activityCount, alertsWeekCount, storageAgg] = await Promise.all([
    workspaceIds.length ? Note.countDocuments(inWs) : 0,
    workspaceIds.length,
    workspaceIds.length ? FileUpload.countDocuments(inWs) : 0,
    workspaceIds.length ? ActivityLog.countDocuments(inWs) : 0,
    workspaceIds.length
      ? ActivityLog.countDocuments({ ...inWs, createdAt: { $gte: weekAgo } })
      : 0,
    workspaceIds.length
      ? FileUpload.aggregate([
          { $match: { workspace: { $in: workspaceIds } } },
          { $group: { _id: null, totalStorage: { $sum: "$size" } } }
        ])
      : Promise.resolve([])
  ]);

  res.status(200).json({
    success: true,
    data: {
      notesCount,
      workspaceCount,
      uploadsCount,
      activityCount,
      /** Activity events in your workspaces in the last 7 days (shown as “alerts”) */
      alertsWeekCount,
      totalStorageBytes: storageAgg[0]?.totalStorage || 0
    }
  });
});

const actionHeadline = (action, metadata) => {
  if (action === "note_updated") return metadata?.headline || "Note updated";
  if (action === "note_restored") return metadata?.headline || "Note restored to an earlier version";
  if (action === "comment_added") return metadata?.headline || "New comment on a note";
  return action?.replace(/_/g, " ") || "Activity";
};

export const getMyActivityFeed = asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit || 40), 100);
  const workspaceIds = await getUserWorkspaceIds(req.user.id);
  if (!workspaceIds.length) {
    return res.status(200).json({ success: true, data: [] });
  }

  const items = await ActivityLog.find({ workspace: { $in: workspaceIds } })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("actor", "name email")
    .populate("workspace", "name");

  const data = items.map((row) => ({
    id: row.id,
    action: row.action,
    headline: actionHeadline(row.action, row.metadata),
    detail: row.metadata?.detail || row.metadata?.noteTitle || "",
    workspaceName: row.workspace?.name || "Workspace",
    workspaceId: row.workspace?._id?.toString(),
    actorName: row.actor?.name || row.actor?.email || "Someone",
    targetType: row.targetType,
    targetId: row.targetId?.toString(),
    createdAt: row.createdAt
  }));

  res.status(200).json({ success: true, data });
});
