import { Workspace } from "../models/Workspace.js";
import { WorkspaceInvite } from "../models/WorkspaceInvite.js";
import { Notification } from "../models/Notification.js";
import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createWorkspace = asyncHandler(async (req, res) => {
  const workspace = await Workspace.create({
    ...req.body,
    owner: req.user.id,
    members: [{ user: req.user.id, role: "owner" }]
  });
  res.status(201).json({ success: true, data: workspace });
});

export const listWorkspaces = asyncHandler(async (req, res) => {
  const items = await Workspace.find({ "members.user": req.user.id }).sort({ updatedAt: -1 });
  res.status(200).json({ success: true, data: items });
});

export const inviteMember = asyncHandler(async (req, res) => {
  const { email, role = "member" } = req.body;
  if (!["member", "admin"].includes(role)) {
    return res.status(400).json({ success: false, message: "Invalid role" });
  }

  const invitedUser = await User.findOne({ email: email.trim().toLowerCase() });
  if (!invitedUser) {
    return res.status(404).json({ success: false, message: "User not found with that email" });
  }

  if (invitedUser._id.toString() === req.user.id.toString()) {
    return res.status(400).json({ success: false, message: "You cannot invite yourself" });
  }

  const alreadyMember = req.workspace.members.some((m) => m.user.toString() === invitedUser._id.toString());
  if (alreadyMember) {
    return res.status(400).json({ success: false, message: "User is already a member of this workspace" });
  }

  const pending = await WorkspaceInvite.findOne({
    workspace: req.workspace._id,
    invitedUser: invitedUser._id,
    status: "pending"
  });
  if (pending) {
    return res.status(200).json({
      success: true,
      message: "An invitation is already pending for this user.",
      data: { inviteId: pending.id }
    });
  }

  const invite = await WorkspaceInvite.create({
    workspace: req.workspace._id,
    invitedBy: req.user.id,
    invitedUser: invitedUser._id,
    role
  });

  const inviterName = req.user.name || req.user.email || "Someone";
  await Notification.create({
    recipient: invitedUser._id,
    actor: req.user.id,
    type: "workspace_invite",
    message: `${inviterName} invited you to join “${req.workspace.name}” as ${role}.`,
    metadata: {
      inviteId: String(invite._id),
      workspaceId: req.workspace.id,
      workspaceName: req.workspace.name,
      role
    }
  });

  return res.status(201).json({
    success: true,
    message: "Invitation sent. They can accept from Inbox.",
    data: { inviteId: invite.id }
  });
});

export const acceptWorkspaceInvite = asyncHandler(async (req, res) => {
  const invite = await WorkspaceInvite.findById(req.params.inviteId).populate("workspace");
  if (!invite || invite.status !== "pending") {
    return res.status(404).json({ success: false, message: "Invite not found or already handled" });
  }
  if (invite.invitedUser.toString() !== req.user.id.toString()) {
    return res.status(403).json({ success: false, message: "This invitation is for another account" });
  }

  const workspace = await Workspace.findById(invite.workspace._id);
  if (!workspace) {
    return res.status(404).json({ success: false, message: "Workspace no longer exists" });
  }

  const exists = workspace.members.some((m) => m.user.toString() === req.user.id.toString());
  if (!exists) {
    workspace.members.push({ user: req.user.id, role: invite.role });
    await workspace.save();
  }

  invite.status = "accepted";
  await invite.save();

  await Notification.deleteMany({
    recipient: req.user.id,
    type: "workspace_invite",
    "metadata.inviteId": invite.id
  });

  const fresh = await Workspace.findById(workspace._id);
  return res.status(200).json({ success: true, data: fresh });
});

export const declineWorkspaceInvite = asyncHandler(async (req, res) => {
  const invite = await WorkspaceInvite.findById(req.params.inviteId);
  if (!invite || invite.status !== "pending") {
    return res.status(404).json({ success: false, message: "Invite not found or already handled" });
  }
  if (invite.invitedUser.toString() !== req.user.id.toString()) {
    return res.status(403).json({ success: false, message: "This invitation is for another account" });
  }

  invite.status = "declined";
  await invite.save();

  await Notification.deleteMany({
    recipient: req.user.id,
    type: "workspace_invite",
    "metadata.inviteId": invite.id
  });

  return res.status(200).json({ success: true, message: "Invitation declined" });
});

export const updateMemberRole = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { role } = req.body;
  const member = req.workspace.members.find((m) => m.user.toString() === userId);
  if (!member) {
    return res.status(404).json({ success: false, message: "Member not found" });
  }
  member.role = role;
  await req.workspace.save();
  return res.status(200).json({ success: true, data: req.workspace });
});
