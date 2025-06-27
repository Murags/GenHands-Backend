import express from 'express';
import {
    getDonationOverviewReport,
    getUserActivityReport,
    getCharityPerformanceReport,
    getVolunteerEfficiencyReport,
    exportReport,
    getDashboardOverview,
    getSupplyDemandAnalysis,
    getOperationalMetrics,
    getUserAnalytics,
    getDonationTrends
} from '../controllers/adminController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Administrative endpoints for reports and dashboard analytics
 */

// All admin routes require authentication and admin role
router.use(protect, admin);

/**
 * @swagger
 * /admin/dashboard/overview:
 *   get:
 *     summary: Get admin dashboard overview metrics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard overview data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalDonations:
 *                       type: object
 *                       properties:
 *                         count: { type: number }
 *                         growth: { type: number }
 *                     activeDonations:
 *                       type: object
 *                       properties:
 *                         count: { type: number }
 *                         growth: { type: number }
 *                     completedDonations:
 *                       type: object
 *                       properties:
 *                         count: { type: number }
 *                         growth: { type: number }
 *                     totalUsers:
 *                       type: object
 *                       properties:
 *                         count: { type: number }
 *                         growth: { type: number }
 *                     activeVolunteers:
 *                       type: object
 *                       properties:
 *                         count: { type: number }
 *                         growth: { type: number }
 *                     verifiedCharities:
 *                       type: object
 *                       properties:
 *                         count: { type: number }
 *                         growth: { type: number }
 *                     pendingPickups:
 *                       type: object
 *                       properties:
 *                         count: { type: number }
 *                         growth: { type: number }
 *                     completedPickups:
 *                       type: object
 *                       properties:
 *                         count: { type: number }
 *                         growth: { type: number }
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /admin/dashboard/supply-demand:
 *   get:
 *     summary: Get supply and demand analysis
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 1y, all]
 *           default: 30d
 *         description: Time period for analysis
 *     responses:
 *       200:
 *         description: Supply and demand analysis data
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /admin/dashboard/operational-metrics:
 *   get:
 *     summary: Get operational metrics for dashboard
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Operational metrics data
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /admin/dashboard/user-analytics:
 *   get:
 *     summary: Get user analytics for dashboard
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 1y, all]
 *           default: 30d
 *         description: Time period for analytics
 *     responses:
 *       200:
 *         description: User analytics data
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /admin/dashboard/donation-trends:
 *   get:
 *     summary: Get donation trends and analytics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: timeframe
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 1y, all]
 *           default: 30d
 *         description: Time period for trends
 *     responses:
 *       200:
 *         description: Donation trends data
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */

// Dashboard endpoints
router.get('/dashboard/overview', getDashboardOverview);
router.get('/dashboard/supply-demand', getSupplyDemandAnalysis);
router.get('/dashboard/operational-metrics', getOperationalMetrics);
router.get('/dashboard/user-analytics', getUserAnalytics);
router.get('/dashboard/donation-trends', getDonationTrends);

// Report viewing endpoints
router.get('/reports/donation-overview', getDonationOverviewReport);
router.get('/reports/user-activity', getUserActivityReport);
router.get('/reports/charity-performance', getCharityPerformanceReport);
router.get('/reports/volunteer-efficiency', getVolunteerEfficiencyReport);

// Report export endpoint
router.get('/reports/export/:reportType', exportReport);

export default router;
