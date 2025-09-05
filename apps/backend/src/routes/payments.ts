import express from 'express';
import { 
  manualPayment,
  checkPaymentStatus,
  getSchedulerStatus,
  triggerPaymentCheck
} from '../controllers/paymentController';
import { auth } from '../middleware/auth';

const router = express.Router();

// POST /api/payments/:id/manual - 수동 결제 처리
router.post('/:id/manual', auth, manualPayment);

// GET /api/payments/scheduler/status - 스케줄러 상태 확인 (먼저 배치)
router.get('/scheduler/status', getSchedulerStatus);

// GET /api/payments/:id/status - 결제 상태 확인
router.get('/:id/status', checkPaymentStatus);

// POST /api/payments/scheduler/trigger - 수동으로 결제 체크 트리거
router.post('/scheduler/trigger', auth, triggerPaymentCheck);

export default router;