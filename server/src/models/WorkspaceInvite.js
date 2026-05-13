import mongoose from "mongoose";

const workspaceInviteSchema = new mongoose.Schema(
  {
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    invitedUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    role: { type: String, enum: ["member", "admin"], default: "member" },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined"],
      default: "pending",
      index: true
    }
  },
  { timestamps: true }
);

workspaceInviteSchema.index({ workspace: 1, invitedUser: 1, status: 1 });

export const WorkspaceInvite = mongoose.model("WorkspaceInvite", workspaceInviteSchema);
