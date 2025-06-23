import express from 'express';
import {
    getDonationOverviewReport,
    getUserActivityReport,
    getCharityPerformanceReport,
    getVolunteerEfficiencyReport,
    exportReport
} from '../controllers/adminController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Admin Reports
 *   description: Administrative reporting and analytics endpoints
 */

// All admin routes require authentication and admin role
router.use(protect, admin);

// Report viewing endpoints
router.get('/reports/donation-overview', getDonationOverviewReport);
router.get('/reports/user-activity', getUserActivityReport);
router.get('/reports/charity-performance', getCharityPerformanceReport);
router.get('/reports/volunteer-efficiency', getVolunteerEfficiencyReport);

// Report export endpoint
router.get('/reports/export/:reportType', exportReport);

export default router;
