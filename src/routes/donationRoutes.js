import express from 'express';
import {
  submitDonation,
  getPickupRequests,
  updatePickupStatus,
  getDonationById,
  searchAddresses,
  getVolunteerPickups,
  getMyDonations
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

/**
 * @swagger
 * /donations/my-donations:
 *   get:
 *     summary: Get all donations submitted by the logged-in user
 *     tags: [Donations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of the user's donations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 donations:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       donorName:
 *                         type: string
 *                       donorEmail:
 *                         type: string
 *                       donorPhone:
 *                         type: string
 *                       organizationName:
 *                         type: string
 *                       organizationType:
 *                         type: string
 *                       pickupAddress:
 *                         type: string
 *                       accessNotes:
 *                         type: string
 *                       donationItems:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             category:
 *                               type: string
 *                             description:
 *                               type: string
 *                             quantity:
 *                               type: string
 *                             condition:
 *                               type: string
 *                       totalWeight:
 *                         type: string
 *                       requiresRefrigeration:
 *                         type: boolean
 *                       fragileItems:
 *                         type: boolean
 *                       deliveryInstructions:
 *                         type: string
 *                       availabilityType:
 *                         type: string
 *                       urgencyLevel:
 *                         type: string
 *                       additionalNotes:
 *                         type: string
 *                       photoConsent:
 *                         type: boolean
 *                       contactPreference:
 *                         type: string
 *                       status:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */

router.post('/', protect, submitDonation);
router.get('/pickup-requests', getPickupRequests);
router.get('/my-pickups', protect, getVolunteerPickups);
router.patch('/pickup-requests/:id/status', protect, updatePickupStatus);
router.get('/search-addresses', searchAddresses);
router.get("/my-donations", protect, getMyDonations);
router.get('/:id', protect, getDonationById);

export default router;
