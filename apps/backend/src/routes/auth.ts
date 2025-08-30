import express from 'express';
import { register, login, getProfile, updateProfile } from '../controllers/authController';
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

export default router;