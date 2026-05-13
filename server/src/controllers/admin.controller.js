import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/User.js";
import { Workspace } from "../models/Workspace.js";

export const listUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select("name email role isEmailVerified createdAt").sort({ createdAt: -1 }).limit(200);
  res.status(200).json({ success: true, data: users });
});

export const updateUserRole = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { role: req.body.role }, { new: true });
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }
  res.status(200).json({ success: true, data: user });
});

export const listAllWorkspaces = asyncHandler(async (req, res) => {
  const workspaces = await Workspace.find().sort({ createdAt: -1 }).limit(200);
  res.status(200).json({ success: true, data: workspaces });
});
