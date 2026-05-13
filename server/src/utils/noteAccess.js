import mongoose from "mongoose";
import { Workspace } from "../models/Workspace.js";

export const isUserMemberOfWorkspace = async (userId, workspaceId) => {
  if (!workspaceId || !mongoose.Types.ObjectId.isValid(String(workspaceId))) return false;
  const ws = await Workspace.findById(workspaceId);
  if (!ws) return false;
  const uid = userId.toString();
  if (ws.owner.toString() === uid) return true;
  return ws.members.some((m) => m.user.toString() === uid);
};

/** Workspaces the user owns or is a member of */
export const getWorkspaceIdsForUser = async (userId) =>
  Workspace.find({
    $or: [{ owner: userId }, { "members.user": userId }]
  }).distinct("_id");

export const canReadNote = async (userId, note) => {
  if (!note) return false;
  if (await isUserMemberOfWorkspace(userId, note.workspace)) return true;
  return note.isPublic === true;
};

export const canEditNote = async (userId, note) => isUserMemberOfWorkspace(userId, note.workspace);
