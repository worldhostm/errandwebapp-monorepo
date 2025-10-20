import express from 'express';
import { register, login, getProfile, updateProfile, sendEmailVerification, verifyEmailCode, resendVerificationCode, changePassword } from '../controllers/authController';
import { auth } from '../middleware/auth';
import { validateRegistration, validateLogin } from '../middleware/validation';

const router = express.Router();

// POST /api/auth/register
router.post('/register', validateRegistration, register);

// POST /api/auth/login
router.post('/login', validateLogin, login);

// GET /api/auth/profile
router.get('/profile', auth, getProfile);

// PUT /api/auth/profile
router.put('/profile', auth, updateProfile);

// POST /api/auth/send-verification
router.post('/send-verification', sendEmailVerification);

// POST /api/auth/verify-email
router.post('/verify-email', verifyEmailCode);

// POST /api/auth/resend-verification
router.post('/resend-verification', resendVerificationCode);

// POST /api/auth/change-password
router.post('/change-password', auth, changePassword);

export default router;