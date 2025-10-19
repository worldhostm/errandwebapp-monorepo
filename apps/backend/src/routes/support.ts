import express from 'express';
import {
  createSupport,
  getMySupportTickets,
  getSupportById,
  addSupportResponse,
  deleteSupport
} from '../controllers/supportController';
import { auth } from '../middleware/auth';

const router = express.Router();

// POST /api/support - 문의 생성
router.post('/', auth, createSupport);

// GET /api/support - 내 문의 목록 조회
router.get('/', auth, getMySupportTickets);

// GET /api/support/:id - 특정 문의 조회
router.get('/:id', auth, getSupportById);

// POST /api/support/:id/response - 문의에 답변 추가
router.post('/:id/response', auth, addSupportResponse);

// DELETE /api/support/:id - 문의 삭제
router.delete('/:id', auth, deleteSupport);

export default router;
