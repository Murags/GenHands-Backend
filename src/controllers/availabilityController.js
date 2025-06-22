import Availability from '../models/Availability.js';
import { calculateDistance } from '../utils/geocoding.js';

/**
 * @swagger
 * components:
 *   schemas:
 *     TimeSlot:
 *       type: object
 *       required:
 *         - startTime
 *         - endTime
 *       properties:
 *         startTime:
 *           type: string
 *           pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
 *           example: "09:00"
 *           description: Start time in HH:MM format
 *         endTime:
 *           type: string
 *           pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
 *           example: "17:00"
 *           description: End time in HH:MM format
 *
 *     RecurringSchedule:
 *       type: object
 *       required:
 *         - dayOfWeek
 *         - timeSlots
 *       properties:
 *         dayOfWeek:
 *           type: integer
 *           minimum: 0
 *           maximum: 6
 *           example: 1
 *           description: Day of week (0=Sunday, 1=Monday, ..., 6=Saturday)
 *         timeSlots:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/TimeSlot'
 *
 *     SpecificDate:
 *       type: object
 *       required:
 *         - date
 *         - timeSlots
 *       properties:
 *         date:
 *           type: string
 *           format: date
 *           example: "2024-12-25"
 *           description: Specific date in YYYY-MM-DD format
 *         timeSlots:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/TimeSlot'
 *
 *     DateRange:
 *       type: object
 *       required:
 *         - startDate
 *         - endDate
 *         - daysOfWeek
 *         - timeSlots
 *       properties:
 *         startDate:
 *           type: string
 *           format: date
 *           example: "2024-11-01"
 *         endDate:
 *           type: string
 *           format: date
 *           example: "2024-11-30"
 *         daysOfWeek:
 *           type: array
 *           items:
 *             type: integer
 *             minimum: 0
 *             maximum: 6
 *           example: [1, 2, 3, 4, 5]
 *           description: Array of days of week
 *         timeSlots:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/TimeSlot'
 *
 *     ServiceArea:
 *       type: object
 *       required:
 *         - center
 *         - maxRadius
 *       properties:
 *         center:
 *           type: object
 *           required:
 *             - coordinates
 *           properties:
 *             coordinates:
 *               type: array
 *               items:
 *                 type: number
 *               minItems: 2
 *               maxItems: 2
 *               example: [36.8219, -1.2921]
 *               description: "[longitude, latitude]"
 *         maxRadius:
 *           type: number
 *           minimum: 1
 *           maximum: 100
 *           example: 15
 *           description: Maximum service radius in kilometers
 *
 *     Preferences:
 *       type: object
 *       properties:
 *         maxPickupsPerDay:
 *           type: integer
 *           minimum: 1
 *           example: 3
 *         transportationMode:
 *           type: string
 *           enum: [car, bicycle, motorcycle, public_transport, walking, other]
 *           example: "car"
 *
 *     AvailabilityRequest:
 *       type: object
 *       required:
 *         - type
 *       properties:
 *         type:
 *           type: string
 *           enum: [recurring_weekly, specific_dates, date_range, always_available]
 *           example: "recurring_weekly"
 *         recurringSchedule:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/RecurringSchedule'
 *           description: Required when type is 'recurring_weekly'
 *         specificDates:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SpecificDate'
 *           description: Required when type is 'specific_dates'
 *         dateRange:
 *           $ref: '#/components/schemas/DateRange'
 *           description: Required when type is 'date_range'
 *         generalTimeSlots:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/TimeSlot'
 *           description: Optional for 'always_available' type
 *         preferences:
 *           $ref: '#/components/schemas/Preferences'
 *         notes:
 *           type: string
 *           maxLength: 500
 *           example: "Available for pickups in Nairobi area"
 *
 *     Availability:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "507f1f77bcf86cd799439011"
 *         volunteer:
 *           type: string
 *           example: "507f1f77bcf86cd799439012"
 *         type:
 *           type: string
 *           enum: [recurring_weekly, specific_dates, date_range, always_available]
 *         recurringSchedule:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/RecurringSchedule'
 *         specificDates:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SpecificDate'
 *         dateRange:
 *           $ref: '#/components/schemas/DateRange'
 *         generalTimeSlots:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/TimeSlot'
 *         serviceArea:
 *           $ref: '#/components/schemas/ServiceArea'
 *         preferences:
 *           $ref: '#/components/schemas/Preferences'
 *         notes:
 *           type: string
 *         isActive:
 *           type: boolean
 *         temporaryUnavailability:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               reason:
 *                 type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /availability:
 *   post:
 *     summary: Create or update volunteer availability
 *     tags: [Availability]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AvailabilityRequest'
 *           examples:
 *             recurring_weekly:
 *               summary: Recurring Weekly Schedule
 *               value:
 *                 type: "recurring_weekly"
 *                 recurringSchedule:
 *                   - dayOfWeek: 1
 *                     timeSlots:
 *                       - startTime: "09:00"
 *                         endTime: "17:00"
 *                   - dayOfWeek: 3
 *                     timeSlots:
 *                       - startTime: "14:00"
 *                         endTime: "18:00"
 *                 serviceArea:
 *                   center:
 *                     coordinates: [36.8219, -1.2921]
 *                   maxRadius: 15
 *                 preferences:
 *                   maxPickupsPerDay: 2
 *                   transportationMode: "car"
 *                 notes: "Available for pickups in Nairobi area"
 *             specific_dates:
 *               summary: Specific Dates Only
 *               value:
 *                 type: "specific_dates"
 *                 specificDates:
 *                   - date: "2024-12-25"
 *                     timeSlots:
 *                       - startTime: "10:00"
 *                         endTime: "14:00"
 *                   - date: "2024-12-31"
 *                     timeSlots:
 *                       - startTime: "09:00"
 *                         endTime: "12:00"
 *                 serviceArea:
 *                   center:
 *                     coordinates: [36.8219, -1.2921]
 *                   maxRadius: 20
 *                 preferences:
 *                   maxPickupsPerDay: 1
 *                   transportationMode: "car"
 *             always_available:
 *               summary: Always Available (24/7)
 *               value:
 *                 type: "always_available"
 *                 preferences:
 *                   maxPickupsPerDay: 10
 *                   transportationMode: "car"
 *     responses:
 *       201:
 *         description: Availability created/updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Availability updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Availability'
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized - JWT token required
 *       500:
 *         description: Server error
 *   delete:
 *     summary: Delete volunteer availability
 *     tags: [Availability]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Availability deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Availability deleted successfully"
 *       404:
 *         description: No availability found to delete
 *       401:
 *         description: Unauthorized - JWT token required
 *       500:
 *         description: Server error
 */

// @desc    Create or update volunteer availability
// @route   POST /api/availability
// @access  Private/Volunteer
export const setAvailability = async (req, res) => {
  try {
    const volunteerId = req.user._id;
    const availabilityData = req.body;

    const existingAvailability = await Availability.findOne({ volunteer: volunteerId });

    let availability;
    if (existingAvailability) {
      Object.assign(existingAvailability, availabilityData);
      availability = await existingAvailability.save();
    } else {
      availability = new Availability({
        volunteer: volunteerId,
        ...availabilityData
      });
      await availability.save();
    }

    res.status(201).json({
      success: true,
      message: 'Availability updated successfully',
      data: availability
    });
  } catch (error) {
    console.error('Error setting availability:', error);
    res.status(500).json({
      success: false,
      message: 'Server error setting availability',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /availability/my:
 *   get:
 *     summary: Get volunteer's own availability
 *     tags: [Availability]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Availability retrieved successfully. If no availability is set, `data` will be `null`.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   oneOf:
 *                     - $ref: '#/components/schemas/Availability'
 *                     - type: object
 *                       nullable: true
 *                       example: null
 *                 message:
 *                   type: string
 *                   example: "No availability has been set for this volunteer."
 *                   description: Included only when no availability is set.
 *       401:
 *         description: Unauthorized - JWT token required
 *       500:
 *         description: Server error
 */

// @desc    Get volunteer's own availability
// @route   GET /api/availability/my
// @access  Private/Volunteer
export const getMyAvailability = async (req, res) => {
  try {
    const volunteerId = req.user._id;

    const availability = await Availability.findOne({ volunteer: volunteerId });

    if (!availability) {
      return res.status(200).json({
        success: true,
        message: 'No availability has been set for this volunteer.',
        data: null
      });
    }

    res.json({
      success: true,
      data: availability
    });
  } catch (error) {
    console.error('Error fetching availability:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching availability',
      error: error.message
    });
  }
};

// @desc    Delete volunteer availability
// @route   DELETE /api/availability
// @access  Private/Volunteer
export const deleteAvailability = async (req, res) => {
  try {
    const volunteerId = req.user._id;

    const availability = await Availability.findOneAndDelete({ volunteer: volunteerId });

    if (!availability) {
      return res.status(404).json({
        success: false,
        message: 'No availability found to delete'
      });
    }

    res.json({
      success: true,
      message: 'Availability deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting availability:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting availability',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /availability/unavailable:
 *   post:
 *     summary: Add temporary unavailability
 *     tags: [Availability]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - startDate
 *               - endDate
 *             properties:
 *               startDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-11-15"
 *                 description: Start date of unavailability
 *               endDate:
 *                 type: string
 *                 format: date
 *                 example: "2024-11-20"
 *                 description: End date of unavailability
 *               reason:
 *                 type: string
 *                 example: "Out of town for vacation"
 *                 description: Optional reason for unavailability
 *     responses:
 *       200:
 *         description: Request processed. The `success` field indicates if the period was added.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                   nullable: true
 *                   description: "The updated list of unavailable periods on success, otherwise null."
 *             examples:
 *               success:
 *                 summary: Successfully added
 *                 value:
 *                   success: true
 *                   message: "Temporary unavailability added successfully"
 *                   data: [{"startDate":"2024-11-15T00:00:00.000Z", "endDate":"2024-11-20T00:00:00.000Z", "reason":"Out of town"}]
 *               failure_no_schedule:
 *                 summary: Availability schedule not set
 *                 value:
 *                   success: false
 *                   message: "You must set your main availability schedule before adding unavailable dates."
 *                   data: null
 *       401:
 *         description: Unauthorized - JWT token required
 *       500:
 *         description: Server error
 */

// @desc    Add temporary unavailability
// @route   POST /api/availability/unavailable
// @access  Private/Volunteer
export const addTemporaryUnavailability = async (req, res) => {
  try {
    const volunteerId = req.user._id;
    const { startDate, endDate, reason } = req.body;

    const availability = await Availability.findOne({ volunteer: volunteerId });
    if (!availability) {
      return res.status(200).json({
        success: false,
        message: 'You must set your main availability schedule before adding unavailable dates.',
        data: null
      });
    }

    availability.temporaryUnavailability.push({
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason
    });

    await availability.save();

    res.json({
      success: true,
      message: 'Temporary unavailability added successfully',
      data: availability.temporaryUnavailability
    });
  } catch (error) {
    console.error('Error adding temporary unavailability:', error);
    res.status(500).json({
      success: false,
      message: 'Server error adding temporary unavailability',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /availability/find-volunteers:
 *   post:
 *     summary: Find available volunteers for a pickup request (Time-based only)
 *     tags: [Availability]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pickupDateTime
 *             properties:
 *               pickupDateTime:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-11-25T14:30:00Z"
 *                 description: Requested pickup date and time to find available volunteers for
 *     responses:
 *       200:
 *         description: A list of available volunteers for the specified time.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 3
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       volunteer:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           email:
 *                             type: string
 *                           phoneNumber:
 *                             type: string
 *                       availabilityId:
 *                         type: string
 *                       preferences:
 *                         $ref: '#/components/schemas/Preferences'
 *                       transportationMode:
 *                         type: string
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized - JWT token required (Admin only)
 *       500:
 *         description: Server error
 */

// @desc    Find available volunteers for a pickup request (Time-based only)
// @route   POST /api/availability/find-volunteers
// @access  Private/Admin (or could be used internally)
export const findAvailableVolunteers = async (req, res) => {
  try {
    const { pickupDateTime } = req.body;

    if (!pickupDateTime) {
      return res.status(400).json({
        success: false,
        message: 'Pickup date/time is required'
      });
    }

    const requestDate = new Date(pickupDateTime);

    const availabilities = await Availability.find({ isActive: true })
      .populate('volunteer', 'name email phoneNumber');

    const availableVolunteers = [];

    for (const availability of availabilities) {
      if (availability.isAvailableAt(requestDate)) {
        availableVolunteers.push({
          volunteer: availability.volunteer,
          availabilityId: availability._id,
          preferences: availability.preferences
        });
      }
    }

    res.json({
      success: true,
      count: availableVolunteers.length,
      data: availableVolunteers
    });
  } catch (error) {
    console.error('Error finding available volunteers:', error);
    res.status(500).json({
      success: false,
      message: 'Server error finding available volunteers',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /availability/check:
 *   post:
 *     summary: Check if volunteer is available at specific time
 *     tags: [Availability]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - dateTime
 *             properties:
 *               dateTime:
 *                 type: string
 *                 format: date-time
 *                 example: "2024-11-25T14:30:00Z"
 *                 description: Date and time to check availability for
 *     responses:
 *       200:
 *         description: Availability check completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 available:
 *                   type: boolean
 *                   example: true
 *                   description: Whether the volunteer is available at the specified time
 *                 dateTime:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-11-25T14:30:00Z"
 *                 message:
 *                   type: string
 *                   example: "No availability schedule set"
 *                   description: Additional message if no schedule is set
 *       400:
 *         description: Missing dateTime parameter
 *       401:
 *         description: Unauthorized - JWT token required
 *       500:
 *         description: Server error
 */

// @desc    Check if volunteer is available at specific time
// @route   POST /api/availability/check
// @access  Private/Volunteer
export const checkAvailability = async (req, res) => {
  try {
    const volunteerId = req.user._id;
    const { dateTime } = req.body;

    if (!dateTime) {
      return res.status(400).json({
        success: false,
        message: 'DateTime is required'
      });
    }

    const availability = await Availability.findOne({ volunteer: volunteerId });
    if (!availability) {
      return res.json({
        success: true,
        available: false,
        message: 'No availability schedule set'
      });
    }

    const isAvailable = availability.isAvailableAt(dateTime);

    res.json({
      success: true,
      available: isAvailable,
      dateTime: dateTime
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({
      success: false,
      message: 'Server error checking availability',
      error: error.message
    });
  }
};
