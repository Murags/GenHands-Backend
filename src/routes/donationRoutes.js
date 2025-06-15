import express from 'express';
import {
  submitDonation,
  getPickupRequests,
  updatePickupStatus,
  getDonationById,
  searchAddresses,
  getVolunteerPickups
} from '../controllers/donationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Donations
 *     description: Donation submission and management
 *   - name: Pickup Requests
 *     description: Volunteer pickup request management
 */

router.post('/', protect, submitDonation);
router.get('/pickup-requests', getPickupRequests);
router.get('/my-pickups', protect, getVolunteerPickups);
router.patch('/pickup-requests/:id/status', protect, updatePickupStatus);
router.get('/search-addresses', searchAddresses);
router.get('/:id', protect, getDonationById);

export default router;
