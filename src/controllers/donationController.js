import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import Donation from '../models/Donation.js';
import { Charity, User } from '../models/User.js';
import Category from '../models/Category.js';
import PickupRequest from '../models/PickupRequest.js';
import { geocodeAddress, calculateDistance, validateCoordinates } from '../utils/geocoding.js';
import { sendEmail } from '../utils/sendEmail.js';

/**
 * @swagger
 * components:
 *   schemas:
 *     DonationItem:
 *       type: object
 *       required:
 *         - category
 *         - description
 *         - quantity
 *         - condition
 *       properties:
 *         category:
 *           type: string
 *           enum: [Food items, Clothing, Electronics, Books, Toys, Furniture, Medical supplies, Household items, Other]
 *         description:
 *           type: string
 *           maxLength: 500
 *         quantity:
 *           type: string
 *           maxLength: 100
 *         condition:
 *           type: string
 *           enum: [new, good, fair, poor]
 *
 *     Donation:
 *       type: object
 *       required:
 *         - donorName
 *         - donorPhone
 *         - pickupAddress
 *         - donationItems
 *         - preferredCharity
 *         - pickupCoordinates
 *       properties:
 *         donorName:
 *           type: string
 *           maxLength: 255
 *         donorPhone:
 *           type: string
 *           maxLength: 20
 *         donorEmail:
 *           type: string
 *           format: email
 *         organizationName:
 *           type: string
 *         organizationType:
 *           type: string
 *           enum: [individual, business, organization, school, restaurant]
 *         pickupAddress:
 *           type: string
 *         pickupCoordinates:
 *           type: array
 *           items:
 *             type: number
 *           description: "Coordinates for pickup location as [longitude, latitude]."
 *           example: [-1.2921, 36.8219]
 *         accessNotes:
 *           type: string
 *         donationItems:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/DonationItem'
 *         totalWeight:
 *           type: string
 *         requiresRefrigeration:
 *           type: boolean
 *         fragileItems:
 *           type: boolean
 *         preferredCharity:
 *           type: string
 *         deliveryInstructions:
 *           type: string
 *         availabilityType:
 *           type: string
 *           enum: [flexible, specific, urgent]
 *         preferredDate:
 *           type: string
 *           format: date
 *         preferredTimeStart:
 *           type: string
 *           pattern: ^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$
 *         preferredTimeEnd:
 *           type: string
 *           pattern: ^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$
 *         urgencyLevel:
 *           type: string
 *           enum: [low, medium, high]
 *         additionalNotes:
 *           type: string
 *         photoConsent:
 *           type: boolean
 *         contactPreference:
 *           type: string
 *           enum: [phone, email, sms]
 */

/**
 * @swagger
 * /donations:
 *   post:
 *     summary: Submit a new donation
 *     tags: [Donations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Donation'
 *     responses:
 *       201:
 *         description: Donation submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 submissionId:
 *                   type: string
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Donation'
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
export const submitDonation = async (req, res) => {
  try {
    const donationData = req.body;
    const { pickupCoordinates, charityId } = donationData;
    const loggedInUser = req.user;

    // Validate coordinates
    if (!pickupCoordinates || !validateCoordinates(pickupCoordinates)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or missing pickup coordinates provided. Expected [longitude, latitude].'
      });
    }

    // Fetch the charity to get destination coordinates
    const charity = await Charity.findById(charityId);
    if (!charity) {
      return res.status(404).json({ success: false, message: 'Charity not found' });
    }


    const processedItems = [];
    for (const item of donationData.donationItems) {
      let categoryId = item.category;

      if (!mongoose.Types.ObjectId.isValid(categoryId)) {
        const categoryObj = await Category.findOne({ name: { $regex: new RegExp(`^${item.category}$`, 'i') } });
        if (!categoryObj) {
          return res.status(400).json({
            success: false,
            message: `Invalid category specified: "${item.category}". This category does not exist.`
          });
        }
        categoryId = categoryObj._id;
      }

      processedItems.push({ ...item, category: categoryId });
    }

    // Generate unique ID
    const donationId = `DON-${Date.now()}`;

    // Create donation record
    const donation = new Donation({
      id: donationId,
      ...donationData,
      donationItems: processedItems, // Use processed items with ObjectId
      donorId: loggedInUser._id,
      donorName: loggedInUser.name,
      donorEmail: loggedInUser.email,
      donorPhone: loggedInUser.phoneNumber || donationData.donorPhone,
      destination: charity.location,
      pickupCoordinates: {
        type: 'Point',
        coordinates: pickupCoordinates
      }
    });

    await donation.save();

    // Create corresponding pickup request
    const pickupRequest = new PickupRequest({
      donation: donation._id,
      charity: charity._id,
      pickupAddress: donationData.pickupAddress,
      pickupCoordinates: {
        type: 'Point',
        coordinates: pickupCoordinates
      },
      deliveryAddress: charity.address || charity.charityName,
      contactPerson: loggedInUser.name,
      contactPhone: loggedInUser.phoneNumber || donationData.donorPhone,
      contactEmail: loggedInUser.email,
      items: donationData.donationItems.map(item => ({
        category: item.category,
        description: item.description,
        quantity: item.quantity,
        condition: item.condition
      })),
      priority: donationData.urgencyLevel,
      metadata: {
        accessNotes: donationData.accessNotes,
        totalWeight: donationData.totalWeight,
        requiresRefrigeration: donationData.requiresRefrigeration,
        fragileItems: donationData.fragileItems,
        contactPreference: donationData.contactPreference,
        additionalNotes: donationData.additionalNotes,
        submittedAt: new Date()
      }
    });

    await pickupRequest.save();

    res.status(201).json({
      success: true,
      submissionId: donation.id,
      message: 'Donation submitted successfully',
      data: {
        donation,
        pickupRequest: {
          id: pickupRequest._id,
          status: pickupRequest.status,
          priority: pickupRequest.priority
        }
      }
    });

  } catch (error) {
    console.error('Donation submission error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to submit donation',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * @swagger
 * /donations/pickup-requests:
 *   get:
 *     summary: Get pickup requests for volunteers
 *     tags: [Pickup Requests]
 *     parameters:
 *       - in: query
 *         name: lat
 *         schema:
 *           type: number
 *         description: Volunteer's latitude
 *       - in: query
 *         name: lng
 *         schema:
 *           type: number
 *         description: Volunteer's longitude
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *           default: 25
 *         description: Search radius in kilometers
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           default: available
 *         description: Filter by status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *         description: Filter by priority
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 20
 *         description: Number of results to return
 *     responses:
 *       200:
 *         description: List of pickup requests
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   charity:
 *                     type: string
 *                   address:
 *                     type: string
 *                   coordinates:
 *                     type: array
 *                     items:
 *                       type: number
 *                   items:
 *                     type: array
 *                     items:
 *                       type: string
 *                   contactPerson:
 *                     type: string
 *                   phone:
 *                     type: string
 *                   priority:
 *                     type: string
 *                   status:
 *                     type: string
 *                   deliveryAddress:
 *                     type: string
 *                   distance:
 *                     type: string
 *                   estimatedTime:
 *                     type: string
 *                   metadata:
 *                     type: object
 */
export const getPickupRequests = async (req, res) => {
  try {
    const {
      lat,
      lng,
      radius = 25,
      status = 'available',
      priority,
      limit = 20
    } = req.query;

    // Build query
    let query = {};

    if (status) {
      query.status = status;
    }

    if (priority) {
      query.priority = priority;
    }

    // Location-based query if coordinates provided
    if (lat && lng) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);

      if (!validateCoordinates([longitude, latitude])) {
        return res.status(400).json({
          success: false,
          message: 'Invalid coordinates provided'
        });
      }

      query.pickupCoordinates = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          $maxDistance: radius * 1000 // Convert km to meters
        }
      };
    }

    const pickupRequests = await PickupRequest.find(query)
      .limit(parseInt(limit))
      .sort({ priority: -1, createdAt: -1 })
      .lean();

    // Calculate distances and format response
    const volunteersLocation = lat && lng ? [parseFloat(lng), parseFloat(lat)] : null;

    const formattedRequests = pickupRequests.map(request => {
      let distance = null;
      let estimatedTime = null;
      const charity = request.charity;

      if (volunteersLocation && request.pickupCoordinates?.coordinates) {
        const requestCoordsLatLon = [request.pickupCoordinates.coordinates[1], request.pickupCoordinates.coordinates[0]];
        const volunteerCoordsLatLon = [volunteersLocation[1], volunteersLocation[0]];
        distance = calculateDistance(volunteerCoordsLatLon, requestCoordsLatLon);
        estimatedTime = Math.round(distance / 30 * 60); // Rough estimate: 30 km/h
      }

      return {
        id: request._id,
        charity: charity ? charity.charityName : 'N/A',
        address: request.pickupAddress,
        coordinates: request.pickupCoordinates?.coordinates,
        items: request.items.map(item => `${item.description} (${item.quantity})`),
        contactPerson: request.contactPerson,
        phone: request.contactPhone,
        priority: request.priority,
        status: request.status,
        deliveryAddress: request.deliveryAddress,
        distance: distance ? `${distance} km` : null,
        estimatedTime: estimatedTime ? `${estimatedTime} min` : null,
        metadata: request.metadata,
        createdAt: request.createdAt,
        updatedAt: request.updatedAt
      };
    });

    const filteredRequests = formattedRequests.filter(request => {
      const originalRequest = pickupRequests.find(pr => pr._id.equals(request.id));
      return !!originalRequest.donation;
    });

    res.json({
      success: true,
      requests: filteredRequests,
      count: filteredRequests.length
    });

  } catch (error) {
    console.error('Get pickup requests error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch pickup requests',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * @swagger
 * /pickup-requests/{id}/status:
 *   patch:
 *     summary: Update pickup request status
 *     tags: [Pickup Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Pickup request ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [accepted, en_route_pickup, arrived_pickup, picked_up, en_route_delivery, delivered, cancelled]
 *               volunteerId:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Status updated successfully
 *       400:
 *         description: Invalid status or request
 *       404:
 *         description: Pickup request not found
 *       500:
 *         description: Server error
 */
export const updatePickupStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    // Validate status
    const validStatuses = [
      'available', 'accepted', 'en_route_pickup', 'arrived_pickup',
      'picked_up', 'en_route_delivery', 'delivered', 'cancelled'
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status provided'
      });
    }

    // Find pickup request
    const pickupRequest = await PickupRequest.findById(id);
    if (!pickupRequest) {
      return res.status(404).json({
        success: false,
        message: 'Pickup request not found'
      });
    }

    // Update pickup request
    const updateData = {
      status,
      updatedAt: new Date()
    };

    if (status === 'accepted') {
      updateData.volunteer = req.user._id;
    }

    if (status === 'accepted' && !pickupRequest.metadata.acceptedAt) {
      updateData['metadata.acceptedAt'] = new Date();
    }

    if (status === 'delivered' && !pickupRequest.metadata.completedAt) {
      updateData['metadata.completedAt'] = new Date();
    }

    if (notes) {
      updateData['metadata.statusNotes'] = notes;
    }

    const updatedRequest = await PickupRequest.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    // Update corresponding donation status
    let donationStatus = 'submitted';
    if (['accepted', 'en_route_pickup', 'arrived_pickup'].includes(status)) {
      donationStatus = 'assigned';
    } else if (['picked_up', 'en_route_delivery'].includes(status)) {
      donationStatus = 'picked_up';
    } else if (status === 'delivered') {
      donationStatus = 'delivered';
    } else if (status === 'cancelled') {
      donationStatus = 'cancelled';
    }

    await Donation.findByIdAndUpdate(
      pickupRequest.donation,
      { status: donationStatus }
    );

    res.json({
      success: true,
      message: 'Status updated successfully',
      updatedRequest: {
        id: updatedRequest._id,
        status: updatedRequest.status,
        volunteerId: updatedRequest.volunteer,
        updatedAt: updatedRequest.updatedAt
      }
    });

  } catch (error) {
    console.error('Update pickup status error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to update pickup status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * @swagger
 * /donations/{id}:
 *   get:
 *     summary: Get donation details by ID
 *     tags: [Donations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Donation ID
 *     responses:
 *       200:
 *         description: Donation details
 *       404:
 *         description: Donation not found
 *       500:
 *         description: Server error
 */
export const getDonationById = async (req, res) => {
  try {
    const { id } = req.params;

    const donation = await Donation.findOne({ id }).lean();
    if (!donation) {
      return res.status(404).json({
        success: false,
        message: 'Donation not found'
      });
    }

    // Get associated pickup request
    const pickupRequest = await PickupRequest.findOne({ donation: donation._id }).lean();

    res.json({
      success: true,
      data: {
        donation,
        pickupRequest
      }
    });

  } catch (error) {
    console.error('Get donation error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch donation',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * @swagger
 * /donations/search-addresses:
 *   get:
 *     summary: Search for address suggestions
 *     tags: [Donations]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 5
 *         description: Number of suggestions to return
 *     responses:
 *       200:
 *         description: Address suggestions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 suggestions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       displayName:
 *                         type: string
 *                       coordinates:
 *                         type: array
 *                         items:
 *                           type: number
 */
export const searchAddresses = async (req, res) => {
  try {
    const { q: query, limit = 5 } = req.query;

    if (!query || query.trim().length < 3) {
      return res.json({
        success: true,
        suggestions: []
      });
    }

    const { searchAddresses } = await import('../utils/geocoding.js');
    const result = await searchAddresses(query, parseInt(limit));

    res.json(result);

  } catch (error) {
    console.error('Address search error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to search addresses',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// @desc    Get all pickup requests assigned to the logged-in volunteer
// @route   GET /api/donations/my-pickups
// @access  Private/Volunteer
export const getVolunteerPickups = async (req, res) => {
  try {
    const volunteerId = req.user._id;
    const { status } = req.query;

    let query = { volunteer: volunteerId };

    if (status) {
      query.status = status;
    }

    const pickupRequests = await PickupRequest.find(query)
      .populate({
        path: 'charity',
        select: 'charityName address'
      })
      .populate({
        path: 'donation',
        select: 'destination' // To get the destination for the map
      })
      .sort({ createdAt: -1 })
      .lean();

    if (!pickupRequests || pickupRequests.length === 0) {
      return res.status(200).json({ success: true, requests: [], count: 0 });
    }

    const formattedRequests = pickupRequests.map(request => ({
      id: request._id,
      charity: request.charity ? request.charity.charityName : 'N/A',
      pickupAddress: request.pickupAddress,
      pickupCoordinates: request.pickupCoordinates.coordinates,
      destinationCoordinates: request.donation ? request.donation.destination?.coordinates : null,
      deliveryAddress: request.charity ? request.charity.address || request.charity.charityName : 'N/A',
      items: request.items.map(item => `${item.description} (${item.quantity})`),
      priority: request.priority,
      status: request.status,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt
    }));

    const filteredRequests = formattedRequests.filter(request => {
      const originalRequest = pickupRequests.find(pr => pr._id.equals(request.id));
      return !!originalRequest.donation;
    });

    res.status(200).json({
      success: true,
      requests: filteredRequests,
      count: filteredRequests.length
    });

  } catch (error) {
    console.error('Get volunteer pickups error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch assigned pickup requests',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

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
export const getMyDonations = async (req, res) => {
  try {
    const userId = req.user._id;
    // Find all donations where the donorId matches the logged-in user
    const donations = await Donation.find({ donorId: userId }).sort({ createdAt: -1 }).lean();

    const formatted = donations.map(donation => ({
      id: donation.id,
      donorName: donation.donorName,
      donorEmail: donation.donorEmail,
      donorPhone: donation.donorPhone,
      organizationName: donation.organizationName,
      organizationType: donation.organizationType,
      pickupAddress: donation.pickupAddress,
      accessNotes: donation.accessNotes,
      donationItems: donation.donationItems.map(item => ({
        category: item.category,
        description: item.description,
        quantity: item.quantity,
        condition: item.condition
      })),
      totalWeight: donation.totalWeight,
      requiresRefrigeration: donation.requiresRefrigeration,
      fragileItems: donation.fragileItems,
      deliveryInstructions: donation.deliveryInstructions,
      availabilityType: donation.availabilityType,
      urgencyLevel: donation.urgencyLevel,
      additionalNotes: donation.additionalNotes,
      photoConsent: donation.photoConsent,
      contactPreference: donation.contactPreference,
      status: donation.status,
      createdAt: donation.createdAt
    }));

    res.json({ success: true, donations: formatted });
  } catch (error) {
    console.error('Get my donations error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch your donations' });
  }
};

// @desc    Get all donations for the logged-in charity
// @route   GET /api/donations/charity
// @access  Private/Charity
export const getCharityDonations = async (req, res) => {
    try {
        const donations = await Donation.find({ charityId: req.user._id })
            .populate('donorId', 'name email')
            .populate('donationItems.category', 'name')
            .sort({ createdAt: -1 });

        // Always return 200 with empty array if no donations found
        res.status(200).json({ success: true, count: donations.length, data: donations || [] });

    } catch (error) {
        console.error('Error fetching charity donations:', error);
        res.status(500).json({ success: false, message: 'Server error while fetching donations.' });
    }
};

// @desc    Confirm delivery of a donation and send thank you note
// @route   POST /api/donations/:id/confirm
// @access  Private/Charity
export const confirmDonationDelivery = async (req, res) => {
    try {
        const { thankYouNote } = req.body;
        const donation = await Donation.findById(req.params.id);

        if (!donation) {
            return res.status(404).json({ success: false, message: 'Donation not found.' });
        }

        // Ensure the logged-in user is the recipient charity
        if (donation.charityId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'You are not authorized to confirm this donation.' });
        }

        // Optionally, check if the donation has been marked as 'delivered' by a volunteer first
        if (donation.status !== 'delivered') {
            return res.status(400).json({ success: false, message: `This donation cannot be confirmed yet. Its current status is '${donation.status}'.` });
        }

        donation.status = 'confirmed';
        donation.thankYouNote = thankYouNote || 'Thank you for your generous donation!';
        donation.confirmedAt = Date.now();

        await donation.save();

        // Send thank you email to the donor
        const donor = await User.findById(donation.donorId);
        if (donor && donor.email) {
            try {
                const charity = await Charity.findById(donation.charityId)
                await sendEmail({
                    to: donor.email,
                    subject: `A Thank You For Your Recent Donation to ${charity.charityName}!`,
                    html: `
                        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                            <h2 style="color: #005AA7;">Dear ${donor.name},</h2>
                            <p>We are writing to express our sincerest gratitude for your recent donation. The items you provided have been safely received by <b>${charity.charityName}</b>.</p>
                            <h3 style="color: #333; border-bottom: 2px solid #005AA7; padding-bottom: 5px;">A Note From the Charity:</h3>
                            <blockquote style="border-left: 4px solid #ddd; padding-left: 15px; margin-left: 0; font-style: italic;">
                                <p>${donation.thankYouNote}</p>
                            </blockquote>
                            <p>Your support makes a huge difference in our community and allows us to continue our work. We are incredibly grateful for your generosity.</p>
                            <p>Warmly,</p>
                            <p><b>The Team at Generous Hands & ${charity.charityName}</b></p>
                        </div>
                    `
                });
            } catch (emailError) {
                console.error(`Failed to send thank you email for donation ${donation._id}:`, emailError);
                // Don't block the response for an email failure
            }
        }

        res.json({ success: true, message: 'Donation confirmed and thank you note sent.', data: donation });

    } catch (error) {
        console.error('Error confirming donation:', error);
        res.status(500).json({ success: false, message: 'Server error while confirming donation.' });
    }
};
