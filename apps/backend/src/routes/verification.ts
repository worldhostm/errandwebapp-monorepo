import express from 'express';
import {
  requestPhoneVerification,
  verifyPhoneCode,
  requestEmailVerification,
  verifyEmailToken,
  requestIdentityVerification,
  requestAddressVerification,
  getVerificationStatus,
  approveVerification,
  rejectVerification
} from '../controllers/verificationController';
import { auth } from '../middleware/auth';

const router = express.Router();

// 전화번호 인증
router.post('/phone/request', auth, requestPhoneVerification);
router.post('/phone/verify', auth, verifyPhoneCode);

// 이메일 인증
router.post('/email/request', auth, requestEmailVerification);
router.get('/email/verify/:token', verifyEmailToken);

// 신분증 인증
router.post('/identity/request', auth, requestIdentityVerification);

// 주소 인증
router.post('/address/request', auth, requestAddressVerification);

// 인증 상태 조회
router.get('/status', auth, getVerificationStatus);

// 관리자 전용 - 인증 승인/거절
router.post('/admin/approve', auth, approveVerification);
router.post('/admin/reject', auth, rejectVerification);

export default router;