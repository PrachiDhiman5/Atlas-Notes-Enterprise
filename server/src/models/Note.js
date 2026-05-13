import mongoose from "mongoose";

const noteSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, default: "" },
    markdown: { type: String, default: "" },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true, index: true },
    tags: [{ type: String, index: true }],
    isArchived: { type: Boolean, default: false },
    isPinned: { type: Boolean, default: false },
    /** When true, authenticated users outside the workspace can read this note */
    isPublic: { type: Boolean, default: false, index: true },
    parentNote: { type: mongoose.Schema.Types.ObjectId, ref: "Note", default: null }
  },
  { timestamps: true }
);

noteSchema.index({ title: "text", content: "text", markdown: "text" });

export const Note = mongoose.model("Note", noteSchema);
