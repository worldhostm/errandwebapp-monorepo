import express from 'express';
import { getUserById, updateUserLocation, getUserRatings } from '../controllers/userController';
import { auth } from '../middleware/auth';

const router = express.Router();

// GET /api/users/:id - Get user by ID
router.get('/:id', getUserById);

// PUT /api/users/location - Update user location
router.put('/location', auth, updateUserLocation);

// GET /api/users/:id/ratings - Get user ratings
router.get('/:id/ratings', getUserRatings);

export default router;