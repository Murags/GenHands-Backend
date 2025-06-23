import express from 'express';
import {
  setAvailability,
  getMyAvailability,
  deleteAvailability,
  addTemporaryUnavailability,
  findAvailableVolunteers,
  checkAvailability
} from '../controllers/availabilityController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Volunteer routes (protected)
router.route('/')
  .post(protect, setAvailability)
  .delete(protect, deleteAvailability);

router.get('/my', protect, getMyAvailability);
router.post('/unavailable', protect, addTemporaryUnavailability);
router.post('/check', protect, checkAvailability);

// Admin/System routes
router.post('/find-volunteers', protect, admin, findAvailableVolunteers);

export default router;
