import mongoose from "mongoose";

const versionSchema = new mongoose.Schema(
  {
    note: { type: mongoose.Schema.Types.ObjectId, ref: "Note", required: true, index: true },
    editedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    markdown: String
  },
  { timestamps: true }
);

export const Version = mongoose.model("Version", versionSchema);
