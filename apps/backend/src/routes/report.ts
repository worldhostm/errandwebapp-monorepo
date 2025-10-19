import express from 'express';
import {
  createReport,
  getMyReports,
  getReportById,
  deleteReport
} from '../controllers/reportController';
import { auth } from '../middleware/auth';

const router = express.Router();

// POST /api/report - 신고 생성
router.post('/', auth, createReport);

// GET /api/report - 내 신고 목록 조회
router.get('/', auth, getMyReports);

// GET /api/report/:id - 특정 신고 조회
router.get('/:id', auth, getReportById);

// DELETE /api/report/:id - 신고 취소
router.delete('/:id', auth, deleteReport);

export default router;
