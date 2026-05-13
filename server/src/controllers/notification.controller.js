import { Notification } from "../models/Notification.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listNotifications = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 20);
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Notification.find({ recipient: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("actor", "name email"),
    Notification.countDocuments({ recipient: req.user.id })
  ]);

  res.status(200).json({
    success: true,
    data: items,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) }
  });
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  const item = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user.id },
    { isRead: true },
    { new: true }
  );
  if (!item) {
    return res.status(404).json({ success: false, message: "Notification not found" });
  }
  res.status(200).json({ success: true, data: item });
});

export const deleteNotification = asyncHandler(async (req, res) => {
  const result = await Notification.deleteOne({ _id: req.params.id, recipient: req.user.id });
  if (!result.deletedCount) {
    return res.status(404).json({ success: false, message: "Notification not found" });
  }
  res.status(200).json({ success: true, message: "Dismissed" });
});
