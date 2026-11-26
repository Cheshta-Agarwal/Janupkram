const express = require('express');
const Notification = require('../models/Notification');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// GET /api/notifications
router.get('/', verifyToken, async (req, res, next) => {
  try {
    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ recipientId: req.user.id }).sort({ createdAt: -1 }).limit(30).lean(),
      Notification.countDocuments({ recipientId: req.user.id, isRead: false }),
    ]);
    return res.json({ notifications, unreadCount });
  } catch (err) {
    return next(err);
  }
});

// PATCH /api/notifications/read-all
router.patch('/read-all', verifyToken, async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipientId: req.user.id, isRead: false },
      { $set: { isRead: true } }
    );
    return res.json({ success: true, unreadCount: 0 });
  } catch (err) {
    return next(err);
  }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', verifyToken, async (req, res, next) => {
  try {
    const updated = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipientId: req.user.id },
      { $set: { isRead: true } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Notification not found.' });
    const unreadCount = await Notification.countDocuments({
      recipientId: req.user.id,
      isRead: false,
    });
    return res.json({ notification: updated, unreadCount });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
