import mongoose from 'mongoose';
import { User, Donor, Volunteer, Admin, Charity } from '../models/User.js';
import Donation from '../models/Donation.js';
import Category from '../models/Category.js';
import PickupRequest from '../models/PickupRequest.js';

/**
 * @swagger
 * tags:
 *   name: Admin Reports
 *   description: Administrative reporting endpoints
 */

/**
 * @swagger
 * /admin/reports/donation-overview:
 *   get:
 *     summary: Get comprehensive donation overview report
 *     tags: [Admin Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for the report period
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for the report period
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 1y, all]
 *           default: 30d
 *         description: Predefined time period
 *     responses:
 *       200:
 *         description: Donation overview report data
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */
export const getDonationOverviewReport = async (req, res) => {
    try {
        const { startDate, endDate, period = '30d' } = req.query;

        // Calculate date range
        let dateFilter = {};
        if (startDate && endDate) {
            dateFilter = {
                createdAt: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                }
            };
        } else {
            const now = new Date();
            const periodMap = {
                '7d': 7,
                '30d': 30,
                '90d': 90,
                '1y': 365,
                'all': null
            };

            if (periodMap[period]) {
                const daysBack = periodMap[period];
                dateFilter = {
                    createdAt: {
                        $gte: new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000))
                    }
                };
            }
        }

        const [
            totalStats,
            statusBreakdown,
            urgencyBreakdown,
            topCharities,
            categoryBreakdown,
            dailyTrends
        ] = await Promise.all([
            // Total statistics
            Donation.aggregate([
                { $match: dateFilter },
                {
                    $group: {
                        _id: null,
                        totalDonations: { $sum: 1 },
                        confirmedDonations: {
                            $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] }
                        },
                        avgConfirmationTime: {
                            $avg: {
                                $cond: [
                                    { $and: ['$confirmedAt', '$createdAt'] },
                                    { $subtract: ['$confirmedAt', '$createdAt'] },
                                    null
                                ]
                            }
                        }
                    }
                }
            ]),

            // Status breakdown
            Donation.aggregate([
                { $match: dateFilter },
                { $group: { _id: '$status', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),

            // Urgency breakdown
            Donation.aggregate([
                { $match: dateFilter },
                { $group: { _id: '$urgencyLevel', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),

            // Top charities by donation count
            Donation.aggregate([
                { $match: dateFilter },
                { $group: { _id: '$charityId', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 },
                {
                    $lookup: {
                        from: 'users',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'charity'
                    }
                },
                { $unwind: '$charity' },
                {
                    $project: {
                        charityName: '$charity.charityName',
                        count: 1
                    }
                }
            ]),

            // Category breakdown
            Donation.aggregate([
                { $match: dateFilter },
                { $unwind: '$donationItems' },
                { $group: { _id: '$donationItems.category', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 10 },
                {
                    $lookup: {
                        from: 'categories',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'category'
                    }
                },
                { $unwind: '$category' },
                {
                    $project: {
                        categoryName: '$category.name',
                        count: 1
                    }
                }
            ]),

            // Daily trends (last 30 days)
            Donation.aggregate([
                {
                    $match: {
                        createdAt: {
                            $gte: new Date(new Date().getTime() - (30 * 24 * 60 * 60 * 1000))
                        }
                    }
                },
                {
                    $group: {
                        _id: {
                            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                        },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ])
        ]);

        const report = {
            summary: {
                totalDonations: totalStats[0]?.totalDonations || 0,
                confirmedDonations: totalStats[0]?.confirmedDonations || 0,
                confirmationRate: totalStats[0]?.totalDonations > 0
                    ? ((totalStats[0]?.confirmedDonations || 0) / totalStats[0].totalDonations * 100).toFixed(1)
                    : 0,
                avgConfirmationTimeHours: totalStats[0]?.avgConfirmationTime
                    ? Math.round(totalStats[0].avgConfirmationTime / (1000 * 60 * 60))
                    : null
            },
            statusBreakdown,
            urgencyBreakdown,
            topCharities,
            categoryBreakdown,
            dailyTrends,
            reportPeriod: {
                startDate: dateFilter.createdAt?.$gte || 'All time',
                endDate: dateFilter.createdAt?.$lte || 'Present',
                period
            }
        };

        res.json({ success: true, data: report });

    } catch (error) {
        console.error('Error generating donation overview report:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while generating report.'
        });
    }
};

/**
 * @swagger
 * /admin/reports/user-activity:
 *   get:
 *     summary: Get user activity and registration report
 *     tags: [Admin Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 1y, all]
 *           default: 30d
 *         description: Time period for the report
 *     responses:
 *       200:
 *         description: User activity report data
 */
export const getUserActivityReport = async (req, res) => {
    try {
        const { period = '30d' } = req.query;

        let dateFilter = {};
        if (period !== 'all') {
            const now = new Date();
            const periodMap = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
            const daysBack = periodMap[period];
            dateFilter = {
                createdAt: {
                    $gte: new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000))
                }
            };
        }

        const [
            totalUsers,
            usersByRole,
            verificationStats,
            registrationTrends,
            activeUsers
        ] = await Promise.all([
            // Total users
            User.countDocuments(dateFilter),

            // Users by role
            User.aggregate([
                { $match: dateFilter },
                { $group: { _id: '$role', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),

            // Verification statistics
            User.aggregate([
                { $match: { role: { $in: ['volunteer', 'charity'] } } },
                {
                    $group: {
                        _id: '$verificationStatus',
                        count: { $sum: 1 }
                    }
                }
            ]),

            // Registration trends
            User.aggregate([
                {
                    $match: {
                        createdAt: {
                            $gte: new Date(new Date().getTime() - (30 * 24 * 60 * 60 * 1000))
                        }
                    }
                },
                {
                    $group: {
                        _id: {
                            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                            role: '$role'
                        },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { '_id.date': 1 } }
            ]),

            // Active users (users with recent donations/pickups)
            Promise.all([
                Donation.distinct('donorId', {
                    createdAt: {
                        $gte: new Date(new Date().getTime() - (30 * 24 * 60 * 60 * 1000))
                    }
                }),
                PickupRequest.distinct('volunteer', {
                    createdAt: {
                        $gte: new Date(new Date().getTime() - (30 * 24 * 60 * 60 * 1000))
                    }
                })
            ])
        ]);

        const report = {
            summary: {
                totalUsers,
                activeDonors: activeUsers[0].length,
                activeVolunteers: activeUsers[1].length,
                pendingVerifications: verificationStats.find(v => v._id === 'pending')?.count || 0
            },
            usersByRole,
            verificationStats,
            registrationTrends,
            reportPeriod: period
        };

        res.json({ success: true, data: report });

    } catch (error) {
        console.error('Error generating user activity report:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while generating report.'
        });
    }
};

/**
 * @swagger
 * /admin/reports/charity-performance:
 *   get:
 *     summary: Get charity performance metrics report
 *     tags: [Admin Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Charity performance report data
 */
export const getCharityPerformanceReport = async (req, res) => {
    try {
        const [
            charityStats,
            responseTimeStats,
            needsFulfillment,
            thankYouNoteStats
        ] = await Promise.all([
            // Basic charity statistics
            Charity.aggregate([
                {
                    $lookup: {
                        from: 'donations',
                        localField: '_id',
                        foreignField: 'charityId',
                        as: 'donations'
                    }
                },
                {
                    $project: {
                        charityName: 1,
                        totalDonations: { $size: '$donations' },
                        confirmedDonations: {
                            $size: {
                                $filter: {
                                    input: '$donations',
                                    cond: { $eq: ['$$this.status', 'confirmed'] }
                                }
                            }
                        },
                        verificationStatus: 1,
                        createdAt: 1
                    }
                },
                {
                    $addFields: {
                        confirmationRate: {
                            $cond: [
                                { $gt: ['$totalDonations', 0] },
                                { $multiply: [{ $divide: ['$confirmedDonations', '$totalDonations'] }, 100] },
                                0
                            ]
                        }
                    }
                },
                { $sort: { totalDonations: -1 } }
            ]),

            // Response time statistics
            Donation.aggregate([
                {
                    $match: {
                        confirmedAt: { $exists: true },
                        createdAt: { $exists: true }
                    }
                },
                {
                    $group: {
                        _id: '$charityId',
                        avgResponseTime: {
                            $avg: { $subtract: ['$confirmedAt', '$createdAt'] }
                        },
                        totalConfirmed: { $sum: 1 }
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'charity'
                    }
                },
                { $unwind: '$charity' },
                {
                    $project: {
                        charityName: '$charity.charityName',
                        avgResponseTimeHours: {
                            $divide: ['$avgResponseTime', 1000 * 60 * 60]
                        },
                        totalConfirmed: 1
                    }
                },
                { $sort: { avgResponseTimeHours: 1 } }
            ]),

            // Needs fulfillment analysis
            Charity.aggregate([
                {
                    $match: {
                        neededCategories: { $exists: true, $ne: [] }
                    }
                },
                {
                    $lookup: {
                        from: 'donations',
                        let: { charityId: '$_id', neededCats: '$neededCategories' },
                        pipeline: [
                            { $match: { $expr: { $eq: ['$charityId', '$$charityId'] } } },
                            { $unwind: '$donationItems' },
                            {
                                $match: {
                                    $expr: {
                                        $in: ['$donationItems.category', '$$neededCats']
                                    }
                                }
                            }
                        ],
                        as: 'matchingDonations'
                    }
                },
                {
                    $project: {
                        charityName: 1,
                        totalNeeds: { $size: '$neededCategories' },
                        matchingDonations: { $size: '$matchingDonations' },
                        needsStatement: 1
                    }
                }
            ]),

            // Thank you note completion stats
            Donation.aggregate([
                { $match: { status: 'confirmed' } },
                {
                    $group: {
                        _id: '$charityId',
                        totalConfirmed: { $sum: 1 },
                        withThankYouNote: {
                            $sum: {
                                $cond: [
                                    { $and: ['$thankYouNote', { $ne: ['$thankYouNote', ''] }] },
                                    1,
                                    0
                                ]
                            }
                        }
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'charity'
                    }
                },
                { $unwind: '$charity' },
                {
                    $project: {
                        charityName: '$charity.charityName',
                        totalConfirmed: 1,
                        withThankYouNote: 1,
                        thankYouNoteRate: {
                            $multiply: [
                                { $divide: ['$withThankYouNote', '$totalConfirmed'] },
                                100
                            ]
                        }
                    }
                },
                { $sort: { thankYouNoteRate: -1 } }
            ])
        ]);

        const report = {
            charityOverview: charityStats,
            responseTimeAnalysis: responseTimeStats,
            needsFulfillment: needsFulfillment,
            thankYouNoteCompletion: thankYouNoteStats,
            summary: {
                totalCharities: charityStats.length,
                avgConfirmationRate: charityStats.length > 0
                    ? (charityStats.reduce((sum, c) => sum + c.confirmationRate, 0) / charityStats.length).toFixed(1)
                    : 0,
                avgResponseTimeHours: responseTimeStats.length > 0
                    ? (responseTimeStats.reduce((sum, c) => sum + c.avgResponseTimeHours, 0) / responseTimeStats.length).toFixed(1)
                    : 0
            }
        };

        res.json({ success: true, data: report });

    } catch (error) {
        console.error('Error generating charity performance report:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while generating report.'
        });
    }
};

/**
 * @swagger
 * /admin/reports/volunteer-efficiency:
 *   get:
 *     summary: Get volunteer efficiency and performance report
 *     tags: [Admin Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Volunteer efficiency report data
 */
export const getVolunteerEfficiencyReport = async (req, res) => {
    try {
        const [
            volunteerStats,
            pickupCompletionRates,
            averageDeliveryTimes,
            mostActiveVolunteers
        ] = await Promise.all([
            // Basic volunteer statistics
            Volunteer.aggregate([
                {
                    $lookup: {
                        from: 'pickuprequests',
                        localField: '_id',
                        foreignField: 'volunteer',
                        as: 'pickups'
                    }
                },
                {
                    $project: {
                        name: 1,
                        verificationStatus: 1,
                        createdAt: 1,
                        totalAssigned: { $size: '$pickups' },
                        completedPickups: {
                            $size: {
                                $filter: {
                                    input: '$pickups',
                                    cond: { $eq: ['$$this.status', 'delivered'] }
                                }
                            }
                        }
                    }
                },
                {
                    $addFields: {
                        completionRate: {
                            $cond: [
                                { $gt: ['$totalAssigned', 0] },
                                { $multiply: [{ $divide: ['$completedPickups', '$totalAssigned'] }, 100] },
                                0
                            ]
                        }
                    }
                }
            ]),

            // Pickup completion rates by status
            PickupRequest.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),

            // Average delivery times
            PickupRequest.aggregate([
                {
                    $match: {
                        status: 'delivered',
                        'metadata.acceptedAt': { $exists: true },
                        'metadata.completedAt': { $exists: true }
                    }
                },
                {
                    $group: {
                        _id: '$volunteer',
                        avgDeliveryTime: {
                            $avg: {
                                $subtract: ['$metadata.completedAt', '$metadata.acceptedAt']
                            }
                        },
                        totalDeliveries: { $sum: 1 }
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'volunteer'
                    }
                },
                { $unwind: '$volunteer' },
                {
                    $project: {
                        volunteerName: '$volunteer.name',
                        avgDeliveryTimeHours: {
                            $divide: ['$avgDeliveryTime', 1000 * 60 * 60]
                        },
                        totalDeliveries: 1
                    }
                },
                { $sort: { avgDeliveryTimeHours: 1 } },
                { $limit: 20 }
            ]),

            // Most active volunteers
            PickupRequest.aggregate([
                { $group: { _id: '$volunteer', totalPickups: { $sum: 1 } } },
                { $sort: { totalPickups: -1 } },
                { $limit: 10 },
                {
                    $lookup: {
                        from: 'users',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'volunteer'
                    }
                },
                { $unwind: '$volunteer' },
                {
                    $project: {
                        volunteerName: '$volunteer.name',
                        totalPickups: 1,
                        verificationStatus: '$volunteer.verificationStatus'
                    }
                }
            ])
        ]);

        const report = {
            volunteerOverview: volunteerStats,
            pickupStatusBreakdown: pickupCompletionRates,
            deliveryTimeAnalysis: averageDeliveryTimes,
            topPerformers: mostActiveVolunteers,
            summary: {
                totalVolunteers: volunteerStats.length,
                verifiedVolunteers: volunteerStats.filter(v => v.verificationStatus === 'verified').length,
                avgCompletionRate: volunteerStats.length > 0
                    ? (volunteerStats.reduce((sum, v) => sum + v.completionRate, 0) / volunteerStats.length).toFixed(1)
                    : 0,
                totalPickupsCompleted: pickupCompletionRates.find(p => p._id === 'delivered')?.count || 0
            }
        };

        res.json({ success: true, data: report });

    } catch (error) {
        console.error('Error generating volunteer efficiency report:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while generating report.'
        });
    }
};

/**
 * @swagger
 * /admin/reports/export/{reportType}:
 *   get:
 *     summary: Export admin report in specified format
 *     tags: [Admin Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reportType
 *         required: true
 *         schema:
 *           type: string
 *           enum: [donation-overview, user-activity, charity-performance, volunteer-efficiency]
 *         description: Type of report to export
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [csv, json]
 *           default: csv
 *         description: Export format
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [7d, 30d, 90d, 1y, all]
 *           default: 30d
 *         description: Time period for applicable reports
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for custom date range
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for custom date range
 *     responses:
 *       200:
 *         description: Report file download
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: Invalid report type or format
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */
export const exportReport = async (req, res) => {
    try {
        const { reportType } = req.params;
        const { format = 'csv', period = '30d', startDate, endDate } = req.query;

        // Validate report type
        const validReportTypes = [
            'donation-overview',
            'user-activity',
            'charity-performance',
            'volunteer-efficiency'
        ];

        if (!validReportTypes.includes(reportType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid report type specified'
            });
        }

        // Validate format
        if (!['csv', 'json'].includes(format)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid format specified. Use csv or json'
            });
        }

        // Get the report data
        let reportData;
        const queryParams = { period, startDate, endDate };

        switch (reportType) {
            case 'donation-overview':
                reportData = await getDonationOverviewData(queryParams);
                break;
            case 'user-activity':
                reportData = await getUserActivityData(queryParams);
                break;
            case 'charity-performance':
                reportData = await getCharityPerformanceData();
                break;
            case 'volunteer-efficiency':
                reportData = await getVolunteerEfficiencyData();
                break;
        }

        // Generate filename
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `${reportType}-report-${timestamp}.${format}`;

        if (format === 'csv') {
            const csvData = convertToCSV(reportData, reportType);

            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.send(csvData);
        } else if (format === 'json') {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.json({
                reportType,
                generatedAt: new Date().toISOString(),
                parameters: queryParams,
                data: reportData
            });
        }

    } catch (error) {
        console.error('Error exporting report:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while exporting report.'
        });
    }
};

// Helper function to convert report data to CSV format
const convertToCSV = (data, reportType) => {
    switch (reportType) {
        case 'donation-overview':
            return generateDonationOverviewCSV(data);
        case 'user-activity':
            return generateUserActivityCSV(data);
        case 'charity-performance':
            return generateCharityPerformanceCSV(data);
        case 'volunteer-efficiency':
            return generateVolunteerEfficiencyCSV(data);
        default:
            return '';
    }
};

// CSV generation functions for each report type
const generateDonationOverviewCSV = (data) => {
    let csv = '';

    // Summary section
    csv += 'DONATION OVERVIEW SUMMARY\n';
    csv += 'Metric,Value\n';
    csv += `Total Donations,${data.summary?.totalDonations || 0}\n`;
    csv += `Confirmed Donations,${data.summary?.confirmedDonations || 0}\n`;
    csv += `Confirmation Rate,${data.summary?.confirmationRate || 0}%\n`;
    csv += `Average Confirmation Time (Hours),${data.summary?.avgConfirmationTimeHours || 'N/A'}\n`;
    csv += '\n';

    // Status breakdown
    csv += 'STATUS BREAKDOWN\n';
    csv += 'Status,Count\n';
    data.statusBreakdown?.forEach(item => {
        csv += `${item._id},${item.count}\n`;
    });
    csv += '\n';

    // Top charities
    csv += 'TOP CHARITIES\n';
    csv += 'Charity Name,Donation Count\n';
    data.topCharities?.forEach(item => {
        csv += `"${item.charityName}",${item.count}\n`;
    });
    csv += '\n';

    // Category breakdown
    csv += 'CATEGORY BREAKDOWN\n';
    csv += 'Category,Count\n';
    data.categoryBreakdown?.forEach(item => {
        csv += `"${item.categoryName}",${item.count}\n`;
    });

    return csv;
};

const generateUserActivityCSV = (data) => {
    let csv = '';

    // Summary section
    csv += 'USER ACTIVITY SUMMARY\n';
    csv += 'Metric,Value\n';
    csv += `Total Users,${data.summary?.totalUsers || 0}\n`;
    csv += `Active Donors,${data.summary?.activeDonors || 0}\n`;
    csv += `Active Volunteers,${data.summary?.activeVolunteers || 0}\n`;
    csv += `Pending Verifications,${data.summary?.pendingVerifications || 0}\n`;
    csv += '\n';

    // Users by role
    csv += 'USERS BY ROLE\n';
    csv += 'Role,Count\n';
    data.usersByRole?.forEach(item => {
        csv += `${item._id},${item.count}\n`;
    });
    csv += '\n';

    // Verification stats
    csv += 'VERIFICATION STATISTICS\n';
    csv += 'Status,Count\n';
    data.verificationStats?.forEach(item => {
        csv += `${item._id || 'N/A'},${item.count}\n`;
    });

    return csv;
};

const generateCharityPerformanceCSV = (data) => {
    let csv = '';

    // Summary section
    csv += 'CHARITY PERFORMANCE SUMMARY\n';
    csv += 'Metric,Value\n';
    csv += `Total Charities,${data.summary?.totalCharities || 0}\n`;
    csv += `Average Confirmation Rate,${data.summary?.avgConfirmationRate || 0}%\n`;
    csv += `Average Response Time (Hours),${data.summary?.avgResponseTimeHours || 'N/A'}\n`;
    csv += '\n';

    // Charity overview
    csv += 'CHARITY OVERVIEW\n';
    csv += 'Charity Name,Total Donations,Confirmed Donations,Confirmation Rate (%),Verification Status\n';
    data.charityOverview?.forEach(item => {
        csv += `"${item.charityName}",${item.totalDonations},${item.confirmedDonations},${item.confirmationRate?.toFixed(1) || 0},${item.verificationStatus}\n`;
    });
    csv += '\n';

    // Response time analysis
    csv += 'RESPONSE TIME ANALYSIS\n';
    csv += 'Charity Name,Average Response Time (Hours),Total Confirmed\n';
    data.responseTimeAnalysis?.forEach(item => {
        csv += `"${item.charityName}",${item.avgResponseTimeHours?.toFixed(1) || 'N/A'},${item.totalConfirmed}\n`;
    });

    return csv;
};

const generateVolunteerEfficiencyCSV = (data) => {
    let csv = '';

    // Summary section
    csv += 'VOLUNTEER EFFICIENCY SUMMARY\n';
    csv += 'Metric,Value\n';
    csv += `Total Volunteers,${data.summary?.totalVolunteers || 0}\n`;
    csv += `Verified Volunteers,${data.summary?.verifiedVolunteers || 0}\n`;
    csv += `Average Completion Rate,${data.summary?.avgCompletionRate || 0}%\n`;
    csv += `Total Pickups Completed,${data.summary?.totalPickupsCompleted || 0}\n`;
    csv += '\n';

    // Top performers
    csv += 'TOP PERFORMING VOLUNTEERS\n';
    csv += 'Volunteer Name,Total Pickups,Verification Status\n';
    data.topPerformers?.forEach(item => {
        csv += `"${item.volunteerName}",${item.totalPickups},${item.verificationStatus}\n`;
    });
    csv += '\n';

    // Pickup status breakdown
    csv += 'PICKUP STATUS BREAKDOWN\n';
    csv += 'Status,Count\n';
    data.pickupStatusBreakdown?.forEach(item => {
        csv += `${item._id},${item.count}\n`;
    });

    return csv;
};

// Data extraction functions (refactored from existing report functions)
const getDonationOverviewData = async ({ period = '30d', startDate, endDate }) => {
    // Calculate date range
    let dateFilter = {};
    if (startDate && endDate) {
        dateFilter = {
            createdAt: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        };
    } else {
        const now = new Date();
        const periodMap = {
            '7d': 7,
            '30d': 30,
            '90d': 90,
            '1y': 365,
            'all': null
        };

        if (periodMap[period]) {
            const daysBack = periodMap[period];
            dateFilter = {
                createdAt: {
                    $gte: new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000))
                }
            };
        }
    }

    const [
        totalStats,
        statusBreakdown,
        urgencyBreakdown,
        topCharities,
        categoryBreakdown,
        dailyTrends
    ] = await Promise.all([
        // Total statistics
        Donation.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: null,
                    totalDonations: { $sum: 1 },
                    confirmedDonations: {
                        $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] }
                    },
                    avgConfirmationTime: {
                        $avg: {
                            $cond: [
                                { $and: ['$confirmedAt', '$createdAt'] },
                                { $subtract: ['$confirmedAt', '$createdAt'] },
                                null
                            ]
                        }
                    }
                }
            }
        ]),

        // Status breakdown
        Donation.aggregate([
            { $match: dateFilter },
            { $group: { _id: '$status', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]),

        // Urgency breakdown
        Donation.aggregate([
            { $match: dateFilter },
            { $group: { _id: '$urgencyLevel', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]),

        // Top charities by donation count
        Donation.aggregate([
            { $match: dateFilter },
            { $group: { _id: '$charityId', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'charity'
                }
            },
            { $unwind: '$charity' },
            {
                $project: {
                    charityName: '$charity.charityName',
                    count: 1
                }
            }
        ]),

        // Category breakdown
        Donation.aggregate([
            { $match: dateFilter },
            { $unwind: '$donationItems' },
            { $group: { _id: '$donationItems.category', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'categories',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'category'
                }
            },
            { $unwind: '$category' },
            {
                $project: {
                    categoryName: '$category.name',
                    count: 1
                }
            }
        ]),

        // Daily trends (last 30 days)
        Donation.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: new Date(new Date().getTime() - (30 * 24 * 60 * 60 * 1000))
                    }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ])
    ]);

    return {
        summary: {
            totalDonations: totalStats[0]?.totalDonations || 0,
            confirmedDonations: totalStats[0]?.confirmedDonations || 0,
            confirmationRate: totalStats[0]?.totalDonations > 0
                ? ((totalStats[0]?.confirmedDonations || 0) / totalStats[0].totalDonations * 100).toFixed(1)
                : 0,
            avgConfirmationTimeHours: totalStats[0]?.avgConfirmationTime
                ? Math.round(totalStats[0].avgConfirmationTime / (1000 * 60 * 60))
                : null
        },
        statusBreakdown,
        urgencyBreakdown,
        topCharities,
        categoryBreakdown,
        dailyTrends,
        reportPeriod: {
            startDate: dateFilter.createdAt?.$gte || 'All time',
            endDate: dateFilter.createdAt?.$lte || 'Present',
            period
        }
    };
};

const getUserActivityData = async ({ period = '30d' }) => {
    let dateFilter = {};
    if (period !== 'all') {
        const now = new Date();
        const periodMap = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
        const daysBack = periodMap[period];
        dateFilter = {
            createdAt: {
                $gte: new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000))
            }
        };
    }

    const [
        totalUsers,
        usersByRole,
        verificationStats,
        registrationTrends,
        activeUsers
    ] = await Promise.all([
        // Total users
        User.countDocuments(dateFilter),

        // Users by role
        User.aggregate([
            { $match: dateFilter },
            { $group: { _id: '$role', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]),

        // Verification statistics
        User.aggregate([
            { $match: { role: { $in: ['volunteer', 'charity'] } } },
            {
                $group: {
                    _id: '$verificationStatus',
                    count: { $sum: 1 }
                }
            }
        ]),

        // Registration trends
        User.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: new Date(new Date().getTime() - (30 * 24 * 60 * 60 * 1000))
                    }
                }
            },
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                        role: '$role'
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.date': 1 } }
        ]),

        // Active users (users with recent donations/pickups)
        Promise.all([
            Donation.distinct('donorId', {
                createdAt: {
                    $gte: new Date(new Date().getTime() - (30 * 24 * 60 * 60 * 1000))
                }
            }),
            PickupRequest.distinct('volunteer', {
                createdAt: {
                    $gte: new Date(new Date().getTime() - (30 * 24 * 60 * 60 * 1000))
                }
            })
        ])
    ]);

    return {
        summary: {
            totalUsers,
            activeDonors: activeUsers[0].length,
            activeVolunteers: activeUsers[1].length,
            pendingVerifications: verificationStats.find(v => v._id === 'pending')?.count || 0
        },
        usersByRole,
        verificationStats,
        registrationTrends,
        reportPeriod: period
    };
};

const getCharityPerformanceData = async () => {
    const [
        charityStats,
        responseTimeStats,
        needsFulfillment,
        thankYouNoteStats
    ] = await Promise.all([
        // Basic charity statistics
        Charity.aggregate([
            {
                $lookup: {
                    from: 'donations',
                    localField: '_id',
                    foreignField: 'charityId',
                    as: 'donations'
                }
            },
            {
                $project: {
                    charityName: 1,
                    totalDonations: { $size: '$donations' },
                    confirmedDonations: {
                        $size: {
                            $filter: {
                                input: '$donations',
                                cond: { $eq: ['$$this.status', 'confirmed'] }
                            }
                        }
                    },
                    verificationStatus: 1,
                    createdAt: 1
                }
            },
            {
                $addFields: {
                    confirmationRate: {
                        $cond: [
                            { $gt: ['$totalDonations', 0] },
                            { $multiply: [{ $divide: ['$confirmedDonations', '$totalDonations'] }, 100] },
                            0
                        ]
                    }
                }
            },
            { $sort: { totalDonations: -1 } }
        ]),

        // Response time statistics
        Donation.aggregate([
            {
                $match: {
                    confirmedAt: { $exists: true },
                    createdAt: { $exists: true }
                }
            },
            {
                $group: {
                    _id: '$charityId',
                    avgResponseTime: {
                        $avg: { $subtract: ['$confirmedAt', '$createdAt'] }
                    },
                    totalConfirmed: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'charity'
                }
            },
            { $unwind: '$charity' },
            {
                $project: {
                    charityName: '$charity.charityName',
                    avgResponseTimeHours: {
                        $divide: ['$avgResponseTime', 1000 * 60 * 60]
                    },
                    totalConfirmed: 1
                }
            },
            { $sort: { avgResponseTimeHours: 1 } }
        ]),

        // Needs fulfillment analysis
        Charity.aggregate([
            {
                $match: {
                    neededCategories: { $exists: true, $ne: [] }
                }
            },
            {
                $lookup: {
                    from: 'donations',
                    let: { charityId: '$_id', neededCats: '$neededCategories' },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$charityId', '$$charityId'] } } },
                        { $unwind: '$donationItems' },
                        {
                            $match: {
                                $expr: {
                                    $in: ['$donationItems.category', '$$neededCats']
                                }
                            }
                        }
                    ],
                    as: 'matchingDonations'
                }
            },
            {
                $project: {
                    charityName: 1,
                    totalNeeds: { $size: '$neededCategories' },
                    matchingDonations: { $size: '$matchingDonations' },
                    needsStatement: 1
                }
            }
        ]),

        // Thank you note completion stats
        Donation.aggregate([
            { $match: { status: 'confirmed' } },
            {
                $group: {
                    _id: '$charityId',
                    totalConfirmed: { $sum: 1 },
                    withThankYouNote: {
                        $sum: {
                            $cond: [
                                { $and: ['$thankYouNote', { $ne: ['$thankYouNote', ''] }] },
                                1,
                                0
                            ]
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'charity'
                }
            },
            { $unwind: '$charity' },
            {
                $project: {
                    charityName: '$charity.charityName',
                    totalConfirmed: 1,
                    withThankYouNote: 1,
                    thankYouNoteRate: {
                        $multiply: [
                            { $divide: ['$withThankYouNote', '$totalConfirmed'] },
                            100
                        ]
                    }
                }
            },
            { $sort: { thankYouNoteRate: -1 } }
        ])
    ]);

    return {
        charityOverview: charityStats,
        responseTimeAnalysis: responseTimeStats,
        needsFulfillment: needsFulfillment,
        thankYouNoteCompletion: thankYouNoteStats,
        summary: {
            totalCharities: charityStats.length,
            avgConfirmationRate: charityStats.length > 0
                ? (charityStats.reduce((sum, c) => sum + c.confirmationRate, 0) / charityStats.length).toFixed(1)
                : 0,
            avgResponseTimeHours: responseTimeStats.length > 0
                ? (responseTimeStats.reduce((sum, c) => sum + c.avgResponseTimeHours, 0) / responseTimeStats.length).toFixed(1)
                : 0
        }
    };
};

const getVolunteerEfficiencyData = async () => {
    const [
        volunteerStats,
        pickupCompletionRates,
        averageDeliveryTimes,
        mostActiveVolunteers
    ] = await Promise.all([
        // Basic volunteer statistics
        Volunteer.aggregate([
            {
                $lookup: {
                    from: 'pickuprequests',
                    localField: '_id',
                    foreignField: 'volunteer',
                    as: 'pickups'
                }
            },
            {
                $project: {
                    name: 1,
                    verificationStatus: 1,
                    createdAt: 1,
                    totalAssigned: { $size: '$pickups' },
                    completedPickups: {
                        $size: {
                            $filter: {
                                input: '$pickups',
                                cond: { $eq: ['$$this.status', 'delivered'] }
                            }
                        }
                    }
                }
            },
            {
                $addFields: {
                    completionRate: {
                        $cond: [
                            { $gt: ['$totalAssigned', 0] },
                            { $multiply: [{ $divide: ['$completedPickups', '$totalAssigned'] }, 100] },
                            0
                        ]
                    }
                }
            }
        ]),

        // Pickup completion rates by status
        PickupRequest.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]),

        // Average delivery times
        PickupRequest.aggregate([
            {
                $match: {
                    status: 'delivered',
                    'metadata.acceptedAt': { $exists: true },
                    'metadata.completedAt': { $exists: true }
                }
            },
            {
                $group: {
                    _id: '$volunteer',
                    avgDeliveryTime: {
                        $avg: {
                            $subtract: ['$metadata.completedAt', '$metadata.acceptedAt']
                        }
                    },
                    totalDeliveries: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'volunteer'
                }
            },
            { $unwind: '$volunteer' },
            {
                $project: {
                    volunteerName: '$volunteer.name',
                    avgDeliveryTimeHours: {
                        $divide: ['$avgDeliveryTime', 1000 * 60 * 60]
                    },
                    totalDeliveries: 1
                }
            },
            { $sort: { avgDeliveryTimeHours: 1 } },
            { $limit: 20 }
        ]),

        // Most active volunteers
        PickupRequest.aggregate([
            { $group: { _id: '$volunteer', totalPickups: { $sum: 1 } } },
            { $sort: { totalPickups: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'volunteer'
                }
            },
            { $unwind: '$volunteer' },
            {
                $project: {
                    volunteerName: '$volunteer.name',
                    totalPickups: 1,
                    verificationStatus: '$volunteer.verificationStatus'
                }
            }
        ])
    ]);

    return {
        volunteerOverview: volunteerStats,
        pickupStatusBreakdown: pickupCompletionRates,
        deliveryTimeAnalysis: averageDeliveryTimes,
        topPerformers: mostActiveVolunteers,
        summary: {
            totalVolunteers: volunteerStats.length,
            verifiedVolunteers: volunteerStats.filter(v => v.verificationStatus === 'verified').length,
            avgCompletionRate: volunteerStats.length > 0
                ? (volunteerStats.reduce((sum, v) => sum + v.completionRate, 0) / volunteerStats.length).toFixed(1)
                : 0,
            totalPickupsCompleted: pickupCompletionRates.find(p => p._id === 'delivered')?.count || 0
        }
    };
};
