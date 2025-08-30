import express from 'express';
import { getChatByErrand, sendMessage, markMessagesAsRead } from '../controllers/chatController';
import { auth } from '../middleware/auth';

const router = express.Router();

// GET /api/chat/errand/:errandId - Get chat for errand
router.get('/errand/:errandId', auth, getChatByErrand);

// POST /api/chat/:chatId/message - Send message
router.post('/:chatId/message', auth, sendMessage);

// PUT /api/chat/:chatId/read - Mark messages as read
router.put('/:chatId/read', auth, markMessagesAsRead);

export default router;