import express from 'express';
import { 
  createErrand, 
  getNearbyErrands, 
  getErrandById, 
  acceptErrand, 
  updateErrandStatus,
  getUserErrands,
  cancelErrand
} from '../controllers/errandController';
import { auth } from '../middleware/auth';
import { validateErrand } from '../middleware/validation';

const router = express.Router();

// POST /api/errands - Create new errand
router.post('/', auth, validateErrand, createErrand);

// GET /api/errands/nearby - Get nearby errands
router.get('/nearby', getNearbyErrands);

// GET /api/errands/user - Get user's errands
router.get('/user', auth, getUserErrands);

// GET /api/errands/:id - Get errand by ID
router.get('/:id', getErrandById);

// POST /api/errands/:id/accept - Accept an errand
router.post('/:id/accept', auth, acceptErrand);

// PUT /api/errands/:id/status - Update errand status
router.put('/:id/status', auth, updateErrandStatus);

// DELETE /api/errands/:id - Cancel errand
router.delete('/:id', auth, cancelErrand);

export default router;