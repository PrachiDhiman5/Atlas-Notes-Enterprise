import { Comment } from "../models/Comment.js";
import { Notification } from "../models/Notification.js";
import { Note } from "../models/Note.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getIO } from "../config/socket.js";
import { logWorkspaceActivity } from "../utils/workspaceActivity.js";
import { canEditNote, canReadNote } from "../utils/noteAccess.js";

const stripHtml = (html) =>
  String(html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);

export const addComment = asyncHandler(async (req, res) => {
  const note = await Note.findById(req.params.noteId);
  if (!note) {
    return res.status(404).json({ success: false, message: "Note not found" });
  }
  if (!(await canEditNote(req.user.id, note))) {
    return res.status(403).json({ success: false, message: "You cannot comment on this note" });
  }

  const comment = await Comment.create({
    note: note.id,
    author: req.user.id,
    body: req.body.body,
    mentions: req.body.mentions || []
  });

  if (req.body.mentions?.length) {
    await Notification.insertMany(
      req.body.mentions.map((userId) => ({
        recipient: userId,
        actor: req.user.id,
        type: "mention",
        message: `${req.user.name || "Someone"} mentioned you in a comment`,
        metadata: { noteId: note.id, commentId: comment.id }
      }))
    );
  }

  getIO().to(`workspace:${note.workspace}`).emit("comment:created", comment);

  const actorName = req.user.name || req.user.email || "Someone";
  await logWorkspaceActivity({
    actorId: req.user.id,
    workspaceId: note.workspace,
    action: "comment_added",
    targetType: "note",
    targetId: note._id,
    metadata: {
      headline: `${actorName} commented on “${note.title || "Untitled"}”`,
      detail: stripHtml(req.body.body) || "New comment",
      noteTitle: note.title
    }
  });

  res.status(201).json({ success: true, data: comment });
});

export const getComments = asyncHandler(async (req, res) => {
  const note = await Note.findById(req.params.noteId);
  if (!note) {
    return res.status(404).json({ success: false, message: "Note not found" });
  }
  if (!(await canReadNote(req.user.id, note))) {
    return res.status(404).json({ success: false, message: "Note not found" });
  }
  const comments = await Comment.find({ note: req.params.noteId })
    .populate("author", "name email")
    .sort({ createdAt: -1 })
    .limit(100);
  res.status(200).json({ success: true, data: comments });
});
