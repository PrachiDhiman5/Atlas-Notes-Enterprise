import mongoose from "mongoose";
import { Note } from "../models/Note.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Version } from "../models/Version.js";
import { getIO } from "../config/socket.js";
import { logWorkspaceActivity } from "../utils/workspaceActivity.js";
import {
  canEditNote,
  canReadNote,
  isUserMemberOfWorkspace
} from "../utils/noteAccess.js";

const stripHtml = (html) =>
  String(html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);

const pickUpdates = (updates) => {
  const keys = ["title", "content", "markdown", "isPublic", "tags", "isPinned", "isArchived"];
  const out = {};
  for (const k of keys) {
    if (updates[k] !== undefined) out[k] = updates[k];
  }
  if (out.isPublic !== undefined) out.isPublic = Boolean(out.isPublic);
  return out;
};

export const createNote = asyncHandler(async (req, res) => {
  const { title, content, markdown, workspace, tags, isArchived, isPinned, isPublic, parentNote } = req.body;
  if (!workspace) {
    return res.status(400).json({ success: false, message: "Workspace is required" });
  }
  if (!mongoose.Types.ObjectId.isValid(String(workspace))) {
    return res.status(400).json({ success: false, message: "Invalid workspace id" });
  }
  if (!(await isUserMemberOfWorkspace(req.user.id, workspace))) {
    return res.status(403).json({ success: false, message: "You are not a member of this workspace" });
  }

  const note = await Note.create({
    title: title?.trim() || "Untitled",
    content: content ?? "",
    markdown: markdown ?? "",
    workspace,
    tags: Array.isArray(tags) ? tags : [],
    isArchived: Boolean(isArchived),
    isPinned: Boolean(isPinned),
    isPublic: Boolean(isPublic),
    parentNote: parentNote || undefined,
    author: req.user.id
  });
  getIO().to(`workspace:${note.workspace}`).emit("note:created", note);
  res.status(201).json({ success: true, data: note });
});

export const getNotes = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 10);
  const skip = (page - 1) * limit;
  const query = {};

  if (req.query.workspace) {
    const wsId = req.query.workspace;
    if (!mongoose.Types.ObjectId.isValid(String(wsId))) {
      return res.status(400).json({ success: false, message: "Invalid workspace id" });
    }
    query.workspace = wsId;
    const member = await isUserMemberOfWorkspace(req.user.id, wsId);
    if (!member) {
      query.isPublic = true;
    }
  } else {
    /** No workspace filter: same catalog for every user — public notes only (any workspace). */
    query.isPublic = true;
  }

  if (req.query.archived !== undefined) query.isArchived = req.query.archived === "true";
  if (req.query.pinned !== undefined) query.isPinned = req.query.pinned === "true";
  if (req.query.tag) query.tags = req.query.tag;
  if (req.query.fromDate || req.query.toDate) {
    query.createdAt = {};
    if (req.query.fromDate) query.createdAt.$gte = new Date(req.query.fromDate);
    if (req.query.toDate) query.createdAt.$lte = new Date(req.query.toDate);
  }
  if (req.query.search) {
    query.$text = { $search: req.query.search };
  }
  const sortField = req.query.sortBy || "updatedAt";
  const sortOrder = req.query.order === "asc" ? 1 : -1;
  const [items, total] = await Promise.all([
    Note.find(query).sort({ [sortField]: sortOrder }).skip(skip).limit(limit),
    Note.countDocuments(query)
  ]);

  res.status(200).json({
    success: true,
    data: items,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) }
  });
});

export const getNoteById = asyncHandler(async (req, res) => {
  const note = await Note.findById(req.params.id);
  if (!note) {
    return res.status(404).json({ success: false, message: "Note not found" });
  }
  if (!(await canReadNote(req.user.id, note))) {
    return res.status(404).json({ success: false, message: "Note not found" });
  }
  const canEdit = await canEditNote(req.user.id, note);
  return res.status(200).json({ success: true, data: note, meta: { canEdit } });
});

export const updateNote = asyncHandler(async (req, res) => {
  const existing = await Note.findById(req.params.id);
  if (!existing) {
    return res.status(404).json({ success: false, message: "Note not found" });
  }
  if (!(await canEditNote(req.user.id, existing))) {
    return res.status(403).json({ success: false, message: "You cannot edit this note" });
  }

  const milestone = Boolean(req.body.milestone);
  const { milestone: _drop, ...rawUpdates } = req.body;
  const updates = pickUpdates(rawUpdates);

  const titleNext = updates.title !== undefined ? updates.title : existing.title;
  const contentNext = updates.content !== undefined ? updates.content : existing.content;
  const markdownNext = updates.markdown !== undefined ? updates.markdown : existing.markdown;
  const isPublicNext = updates.isPublic !== undefined ? Boolean(updates.isPublic) : existing.isPublic;

  const contentChanged =
    titleNext !== existing.title || contentNext !== existing.content || markdownNext !== existing.markdown;
  const visibilityChanged = isPublicNext !== existing.isPublic;

  if (!contentChanged && !milestone && !visibilityChanged) {
    return res.status(200).json({ success: true, data: existing });
  }

  let shouldSnapshot = false;
  if (milestone && contentChanged) {
    shouldSnapshot = true;
  } else if (contentChanged && !milestone) {
    const lastVersion = await Version.findOne({ note: existing._id }).sort({ createdAt: -1 });
    if (!lastVersion) {
      shouldSnapshot = true;
    } else {
      const gapMs = Date.now() - new Date(lastVersion.createdAt).getTime();
      if (gapMs >= 120_000) {
        shouldSnapshot = true;
      }
    }
  }

  if (shouldSnapshot) {
    await Version.create({
      note: existing.id,
      editedBy: req.user.id,
      title: existing.title,
      content: existing.content,
      markdown: existing.markdown
    });
  }

  const note = await Note.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  getIO().to(`workspace:${note.workspace}`).emit("note:updated", note);

  if (contentChanged) {
    await logWorkspaceActivity({
      actorId: req.user.id,
      workspaceId: note.workspace,
      action: "note_updated",
      targetType: "note",
      targetId: note._id,
      metadata: {
        headline: `Note updated: ${note.title || "Untitled"}`,
        detail: stripHtml(note.content) || "Content changed",
        noteTitle: note.title
      }
    });
  }

  res.status(200).json({ success: true, data: note });
});

export const deleteNote = asyncHandler(async (req, res) => {
  const note = await Note.findById(req.params.id);
  if (!note) {
    return res.status(404).json({ success: false, message: "Note not found" });
  }
  if (!(await canEditNote(req.user.id, note))) {
    return res.status(403).json({ success: false, message: "You cannot delete this note" });
  }
  await Note.findByIdAndDelete(req.params.id);
  getIO().to(`workspace:${note.workspace}`).emit("note:deleted", { id: note.id });
  res.status(200).json({ success: true, message: "Note deleted" });
});

export const listVersions = asyncHandler(async (req, res) => {
  const note = await Note.findById(req.params.id);
  if (!note) {
    return res.status(404).json({ success: false, message: "Note not found" });
  }
  if (!(await canReadNote(req.user.id, note))) {
    return res.status(404).json({ success: false, message: "Note not found" });
  }
  const versions = await Version.find({ note: req.params.id }).sort({ createdAt: -1 }).limit(30);
  res.status(200).json({ success: true, data: versions });
});

export const restoreVersion = asyncHandler(async (req, res) => {
  const note = await Note.findById(req.params.id);
  if (!note) {
    return res.status(404).json({ success: false, message: "Note not found" });
  }
  if (!(await canEditNote(req.user.id, note))) {
    return res.status(403).json({ success: false, message: "You cannot edit this note" });
  }

  const version = await Version.findById(req.params.versionId);
  if (!version) {
    return res.status(404).json({ success: false, message: "Version not found" });
  }

  const updated = await Note.findByIdAndUpdate(
    req.params.id,
    { title: version.title, content: version.content, markdown: version.markdown || "" },
    { new: true }
  );

  if (!updated) {
    return res.status(404).json({ success: false, message: "Note not found" });
  }

  getIO().to(`workspace:${updated.workspace}`).emit("note:restored", updated);

  await logWorkspaceActivity({
    actorId: req.user.id,
    workspaceId: updated.workspace,
    action: "note_restored",
    targetType: "note",
    targetId: updated._id,
    metadata: {
      headline: `Version restored: ${updated.title || "Untitled"}`,
      detail: "An earlier version of this note was restored.",
      noteTitle: updated.title
    }
  });

  res.status(200).json({ success: true, data: updated });
});
