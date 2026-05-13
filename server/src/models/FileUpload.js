import mongoose from "mongoose";

const fileUploadSchema = new mongoose.Schema(
  {
    fileName: { type: String, required: true },
    fileType: { type: String, required: true },
    size: { type: Number, required: true },
    url: { type: String, required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: "Workspace", required: true },
    /** When set, file appears on this note’s attachments list */
    note: { type: mongoose.Schema.Types.ObjectId, ref: "Note", index: true, default: null },
    /** Stored filename under env.uploadDir (local storage when Cloudinary is off) */
    localDiskKey: { type: String, default: null }
  },
  { timestamps: true }
);

export const FileUpload = mongoose.model("FileUpload", fileUploadSchema);
