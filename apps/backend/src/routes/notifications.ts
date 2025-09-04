import express from 'express';
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadCount
} from '../controllers/notificationController';
import { auth } from '../middleware/auth';

const router = express.Router();

// GET /api/notifications - Get user's notifications
router.get('/', auth, getUserNotifications);

// GET /api/notifications/unread-count - Get unread notifications count
router.get('/unread-count', auth, getUnreadCount);

// PUT /api/notifications/:id/read - Mark notification as read
router.put('/:id/read', auth, markNotificationAsRead);

// PUT /api/notifications/read-all - Mark all notifications as read
router.put('/read-all', auth, markAllNotificationsAsRead);

export default router;