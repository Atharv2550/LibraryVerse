const Notification = require('../models/Notification.model');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { getDBStatus } = require('../config/db');

const getNotifications = asyncHandler(async (req, res) => {
  if (!getDBStatus()) {
    throw new ApiError(503, 'Database service is currently unavailable.');
  }

  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find({ user: req.user._id })
      .populate('actor', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Notification.countDocuments({ user: req.user._id }),
    Notification.countDocuments({ user: req.user._id, isRead: false })
  ]);

  return res.json(
    new ApiResponse(200, {
      items: notifications,
      unreadCount,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1
      }
    }, 'Notifications fetched successfully')
  );
});

const getUnreadCount = asyncHandler(async (req, res) => {
  if (!getDBStatus()) {
    throw new ApiError(503, 'Database service is currently unavailable.');
  }

  const unreadCount = await Notification.countDocuments({ user: req.user._id, isRead: false });
  return res.json(new ApiResponse(200, { unreadCount }, 'Unread count fetched'));
});

const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!getDBStatus()) {
    throw new ApiError(503, 'Database service is currently unavailable.');
  }

  const notification = await Notification.findOneAndUpdate(
    { _id: id, user: req.user._id },
    { isRead: true },
    { new: true }
  ).populate('actor', 'name avatar');

  if (!notification) {
    throw new ApiError(404, 'Notification not found');
  }

  return res.json(new ApiResponse(200, notification, 'Notification marked as read'));
});

const markAllAsRead = asyncHandler(async (req, res) => {
  if (!getDBStatus()) {
    throw new ApiError(503, 'Database service is currently unavailable.');
  }

  await Notification.updateMany(
    { user: req.user._id, isRead: false },
    { $set: { isRead: true } }
  );

  return res.json(new ApiResponse(200, null, 'All notifications marked as read'));
});

const deleteNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!getDBStatus()) {
    throw new ApiError(503, 'Database service is currently unavailable.');
  }

  const notification = await Notification.findOneAndDelete({ _id: id, user: req.user._id });
  if (!notification) {
    throw new ApiError(404, 'Notification not found');
  }

  return res.json(new ApiResponse(200, null, 'Notification removed successfully'));
});

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification
};
