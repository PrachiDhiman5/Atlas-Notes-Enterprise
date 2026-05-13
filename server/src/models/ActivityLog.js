import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", index: true },
    action: { type: String, required: true },
    targetType: { type: String, required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
    metadata: { type: Object, default: {} }
  },
  { timestamps: true }
);

export const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);
