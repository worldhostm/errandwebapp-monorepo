import express from 'express';
import { 
  createErrand, 
  getNearbyErrands, 
  getErrandById, 
  acceptErrand, 
  updateErrandStatus,
  getUserErrands,
  cancelErrand,
  completeErrandWithVerification,
  reportDispute,
  getErrandWithVerification,
  checkActiveErrand,
  debugAllErrands
} from '../controllers/errandController';
import { auth, optionalAuth } from '../middleware/auth';

const router = express.Router();

// POST /api/errands - Create new errand
router.post('/', auth, createErrand);

// GET /api/errands/nearby - Get nearby errands
router.get('/nearby', optionalAuth, getNearbyErrands);

// GET /api/errands/user - Get user's errands
router.get('/user', auth, getUserErrands);

// GET /api/errands/check-active - Check if user has active errand
router.get('/check-active', auth, checkActiveErrand);

// Debug route to see all errands (move before :id routes)
router.get('/debug/all', debugAllErrands);

// GET /api/errands/:id/verification - Get errand with completion verification (specific route first)
router.get('/:id/verification', getErrandWithVerification);

// GET /api/errands/:id - Get errand by ID (general route last)
router.get('/:id', getErrandById);

// POST /api/errands/:id/accept - Accept an errand
router.post('/:id/accept', auth, acceptErrand);

// PUT /api/errands/:id/status - Update errand status
router.put('/:id/status', auth, updateErrandStatus);

// POST /api/errands/:id/complete-verification - Complete errand with verification
router.post('/:id/complete-verification', auth, completeErrandWithVerification);

// POST /api/errands/:id/dispute - Report dispute for completed errand
router.post('/:id/dispute', auth, reportDispute);

// DELETE /api/errands/:id - Cancel errand
router.delete('/:id', auth, cancelErrand);

export default router;