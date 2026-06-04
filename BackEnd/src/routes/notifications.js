const express = require('express');
const router = express.Router();
const {
  listNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} = require('../controllers/notificationController');

// IMPORTANT: the more-specific routes must be registered BEFORE the parameterised
// route (:id) so Express doesn't swallow "read-all" and "unread-count" as IDs.

// GET  /api/notifications/unread-count   → { count: N }
router.get('/unread-count', getUnreadCount);

// PATCH /api/notifications/read-all      → mark all as read
router.patch('/read-all', markAllAsRead);

// GET  /api/notifications                → list (optional ?is_read=false)
router.get('/', listNotifications);

// PATCH /api/notifications/:id/read      → mark single as read
router.patch('/:id/read', markAsRead);

module.exports = router;