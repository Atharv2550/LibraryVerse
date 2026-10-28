const Notification = require('../models/Notification.model');
const { getIO } = require('../config/socket');
const { getDBStatus } = require('../config/db');

/**
 * Creates and delivers a notification
 * @param {Object} param0 
 * @param {string|mongoose.Types.ObjectId} param0.user - Recipient user ID
 * @param {string} param0.type - Type of notification
 * @param {string} param0.title - Short title
 * @param {string} param0.message - Detailed message
 * @param {string} [param0.referenceType] - Reference entity type
 * @param {*} [param0.referenceId] - Reference entity ID
 * @param {string|mongoose.Types.ObjectId} [param0.actor] - Triggering user ID
 */
const createNotification = async ({
  user,
  type,
  title,
  message,
  referenceType = null,
  referenceId = null,
  actor = null
}) => {
  if (!getDBStatus() || !user) return null;

  try {
    // Avoid notifying user of their own action
    if (actor && actor.toString() === user.toString()) {
      return null;
    }

    const notification = await Notification.create({
      user,
      type,
      title,
      message,
      referenceType,
      referenceId,
      actor,
      isRead: false
    });

    const populated = await Notification.findById(notification._id)
      .populate('actor', 'name avatar');

    // Attempt real-time socket emit to the user's room
    try {
      const io = getIO();
      if (io) {
        io.to(`user_${user.toString()}`).emit('new_notification', populated);
      }
    } catch (socketErr) {
      // Non-blocking if socket is not active
    }

    return populated;
  } catch (error) {
    console.error('Error creating notification:', error.message);
    return null;
  }
};

module.exports = { createNotification };
