import fs from "fs/promises";
import path from "path";
import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { FileUpload } from "../models/FileUpload.js";
import { Note } from "../models/Note.js";
import { Workspace } from "../models/Workspace.js";
import { uploadToCloudinary } from "../services/upload.service.js";
import { getIO } from "../config/socket.js";
import { env } from "../config/env.js";
import { canEditNote, canReadNote } from "../utils/noteAccess.js";

const canAccessWorkspace = (workspace, userId) => {
  const uid = userId.toString();
  if (workspace.owner.toString() === uid) return true;
  return workspace.members.some((m) => m.user.toString() === uid);
};

export const streamUploadFile = asyncHandler(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ success: false, message: "Invalid file id" });
  }

  const file = await FileUpload.findById(req.params.id);
  if (!file) {
    return res.status(404).json({ success: false, message: "File not found" });
  }

  const workspace = await Workspace.findById(file.workspace);
  if (!workspace) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }

  if (file.note) {
    const note = await Note.findById(file.note);
    if (!note || !(await canReadNote(req.user.id, note))) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
  } else if (!canAccessWorkspace(workspace, req.user.id)) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }

  if (file.localDiskKey) {
    const abs = path.join(env.uploadDir, file.localDiskKey);
    res.setHeader("Content-Type", file.fileType || "application/octet-stream");
    res.setHeader("Content-Disposition", `inline; filename*=UTF-8''${encodeURIComponent(file.fileName)}`);
    return res.sendFile(path.resolve(abs));
  }

  if (file.url?.startsWith("http")) {
    if (file.url.includes("example.com")) {
      return res.status(410).json({
        success: false,
        message: "This file was stored with a placeholder URL. Re-upload the file to open it."
      });
    }
    return res.redirect(302, file.url);
  }

  return res.status(404).json({ success: false, message: "File is not available on disk or remote storage." });
});

export const listUploadsForNote = asyncHandler(async (req, res) => {
  const noteId = req.query.note;
  if (!noteId || !mongoose.Types.ObjectId.isValid(noteId)) {
    return res.status(400).json({ success: false, message: "Query ?note=<id> is required" });
  }

  const note = await Note.findById(noteId);
  if (!note) {
    return res.status(404).json({ success: false, message: "Note not found" });
  }

  const workspace = await Workspace.findById(note.workspace);
  if (!workspace) {
    return res.status(404).json({ success: false, message: "Workspace not found" });
  }
  if (!(await canReadNote(req.user.id, note))) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }

  const files = await FileUpload.find({ note: noteId })
    .sort({ createdAt: -1 })
    .populate("uploadedBy", "name email")
    .limit(100);

  res.status(200).json({ success: true, data: files });
});

export const uploadFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "File is required" });
  }

  const workspaceId = req.body.workspace;
  if (!workspaceId || !mongoose.Types.ObjectId.isValid(workspaceId)) {
    return res.status(400).json({ success: false, message: "Valid workspace id is required" });
  }

  const workspace = await Workspace.findById(workspaceId);
  if (!workspace || !canAccessWorkspace(workspace, req.user.id)) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }

  let noteRef = null;
  const noteId = req.body.note;
  if (noteId && mongoose.Types.ObjectId.isValid(noteId)) {
    const noteDoc = await Note.findById(noteId);
    if (!noteDoc || noteDoc.workspace.toString() !== workspaceId) {
      return res.status(400).json({ success: false, message: "Note does not belong to this workspace" });
    }
    if (!(await canEditNote(req.user.id, noteDoc))) {
      return res.status(403).json({ success: false, message: "You cannot attach files to this note" });
    }
    noteRef = noteDoc._id;
  }

  await fs.mkdir(env.uploadDir, { recursive: true });

  const cloudUrl = await uploadToCloudinary(req.file.buffer, "collab-notes/uploads");

  let fileDoc;
  if (cloudUrl) {
    fileDoc = await FileUpload.create({
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      size: req.file.size,
      url: cloudUrl,
      uploadedBy: req.user.id,
      workspace: workspaceId,
      note: noteRef || undefined,
      localDiskKey: null
    });
  } else {
    const fileId = new mongoose.Types.ObjectId();
    const localDiskKey = fileId.toString();
    const dest = path.join(env.uploadDir, localDiskKey);
    await fs.writeFile(dest, req.file.buffer);
    fileDoc = await FileUpload.create({
      _id: fileId,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      size: req.file.size,
      url: `/api/v1/uploads/stream/${fileId}`,
      uploadedBy: req.user.id,
      workspace: workspaceId,
      note: noteRef || undefined,
      localDiskKey
    });
  }

  getIO().to(`workspace:${workspaceId}`).emit("file:uploaded", {
    noteId: noteRef ? String(noteRef) : null,
    file: fileDoc.toObject ? fileDoc.toObject() : fileDoc
  });

  res.status(201).json({ success: true, data: fileDoc });
});
