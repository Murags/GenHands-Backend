import express from 'express';
import { registerUser, loginUser, verifyUser, getUsersPendingVerification, getUsers, getCharities, getMe } from '../controllers/authController.js';
import { protect, admin } from '../middleware/authMiddleware.js';
import volunteerUpload from '../middleware/uploads/volunteerDocs/volunteerDocs.js';
import charityUpload from '../middleware/uploads/charityDocs/charityDocs.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication and registration
 */

/**
 * @swagger
 * /auth/register/volunteer:
 *   post:
 *     summary: Register a new volunteer
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - documents
 *             properties:
 *               name:
 *                 type: string
 *                 example: Jane Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: jane@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *               documents:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Supporting documents (required)
 *     responses:
 *       201:
 *         description: Volunteer registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id: { type: string }
 *                 name: { type: string }
 *                 email: { type: string }
 *                 role: { type: string }
 *                 userType: { type: string }
 *                 isVerified: { type: boolean }
 *                 verificationStatus: { type: string }
 *                 token: { type: string }
 *                 message:
 *                   type: string
 *                   description: Verification message for volunteers
 *                 isPending:
 *                   type: boolean
 *                   description: Flag indicating if verification is pending
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
// Volunteer registration
router.post('/register/volunteer', volunteerUpload.array('documents'), registerUser);

/**
 * @swagger
 * /auth/register/charity:
 *   post:
 *     summary: Register a new charity
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - documents
 *             properties:
 *               name:
 *                 type: string
 *                 example: Charity Org
 *               email:
 *                 type: string
 *                 format: email
 *                 example: charity@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *               documents:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Supporting documents (required)
 *     responses:
 *       201:
 *         description: Charity registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id: { type: string }
 *                 name: { type: string }
 *                 email: { type: string }
 *                 role: { type: string }
 *                 userType: { type: string }
 *                 isVerified: { type: boolean }
 *                 verificationStatus: { type: string }
 *                 token: { type: string }
 *                 message:
 *                   type: string
 *                   description: Verification message for charities
 *                 isPending:
 *                   type: boolean
 *                   description: Flag indicating if verification is pending
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
// Charity registration
router.post('/register/charity', charityUpload.array('documents'), registerUser);

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new donor or admin
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Donor
 *               email:
 *                 type: string
 *                 format: email
 *                 example: donor@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *               role:
 *                 type: string
 *                 enum: [donor, admin]
 *                 example: donor
 *     responses:
 *       201:
 *         description: Donor or admin registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id: { type: string }
 *                 name: { type: string }
 *                 email: { type: string }
 *                 role: { type: string }
 *                 userType: { type: string }
 *                 isVerified: { type: boolean }
 *                 verificationStatus: { type: string }
 *                 token: { type: string }
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
// Donor registration
router.post('/register', registerUser)

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Authenticate a user and get a JWT token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *     responses:
 *       200:
 *         description: Successful login
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id: { type: string }
 *                 name: { type: string }
 *                 email: { type: string }
 *                 role: { type: string }
 *                 userType: { type: string }
 *                 isVerified: { type: boolean }
 *                 verificationStatus: { type: string }
 *                 token: { type: string }
 *       400:
 *         description: Missing email or password
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Account pending verification
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 verificationStatus: { type: string }
 *                 isPending: { type: boolean }
 *       500:
 *         description: Server error
 */
router.post('/login', loginUser);

/**
 * @swagger
 * /auth/users:
 *   get:
 *     summary: Get users with filtering by role and verification status
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [volunteer, charity, donor, admin]
 *         description: Filter users by role
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, verified, rejected, in_progress]
 *         description: Filter users by verification status (applies to volunteers and charities only)
 *     responses:
 *       200:
 *         description: List of users matching the filter criteria
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id: { type: string }
 *                   name: { type: string }
 *                   email: { type: string }
 *                   role: { type: string }
 *                   userType: { type: string }
 *                   isVerified: { type: boolean }
 *                   verificationStatus: { type: string }
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not authorized as admin
 *       500:
 *         description: Server error
 */
router.get('/users', getUsers);

/**
 * @swagger
 * /auth/pending-verification:
 *   get:
 *     summary: Get all users pending verification (deprecated - use /users?status=pending instead)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [volunteer, charity]
 *         description: Filter pending users by role
 *     responses:
 *       200:
 *         description: List of pending users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id: { type: string }
 *                   name: { type: string }
 *                   email: { type: string }
 *                   role: { type: string }
 *                   userType: { type: string }
 *                   isVerified: { type: boolean }
 *                   verificationStatus: { type: string }
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not authorized as admin
 *       500:
 *         description: Server error
 */
router.get('/pending-verification', getUsersPendingVerification); /* Add protect and admin middleware */

/**
 * @swagger
 * /auth/verify/{id}:
 *   put:
 *     summary: Verify or reject a user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [approve, reject]
 *                 example: approve
 *                 description: Action to perform - approve or reject
 *     responses:
 *       200:
 *         description: User verification status updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message: { type: string }
 *                 user:
 *                   type: object
 *                   properties:
 *                     _id: { type: string }
 *                     name: { type: string }
 *                     email: { type: string }
 *                     role: { type: string }
 *                     isVerified: { type: boolean }
 *                     verificationStatus: { type: string }
 *       400:
 *         description: Invalid input or user type
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not authorized as admin
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.put('/verify/:id', protect, admin, verifyUser);

router.route('/charities').get(getCharities);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439011"
 *                     name:
 *                       type: string
 *                       example: "John Doe"
 *                     email:
 *                       type: string
 *                       example: "john@example.com"
 *                     role:
 *                       type: string
 *                       enum: [donor, volunteer, charity, admin]
 *                       example: "donor"
 *                     userType:
 *                       type: string
 *                       example: "Donor"
 *                     isVerified:
 *                       type: boolean
 *                       example: true
 *                     phoneNumber:
 *                       type: string
 *                       example: "+1234567890"
 *                     address:
 *                       type: string
 *                       example: "123 Main St, City, State"
 *                     location:
 *                       type: object
 *                       properties:
 *                         type:
 *                           type: string
 *                           example: "Point"
 *                         coordinates:
 *                           type: array
 *                           items:
 *                             type: number
 *                           example: [-73.856077, 40.848447]
 *                     verificationStatus:
 *                       type: string
 *                       enum: [pending, verified, rejected, in_progress]
 *                       example: "verified"
 *                       description: "Only present for volunteers and charities"
 *                     isPending:
 *                       type: boolean
 *                       example: false
 *                       description: "Only present for volunteers and charities"
 *                     isRejected:
 *                       type: boolean
 *                       example: false
 *                       description: "Only present for volunteers and charities"
 *                     charityName:
 *                       type: string
 *                       example: "Food Bank Central"
 *                       description: "Only present for charities"
 *                     neededCategories:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           description:
 *                             type: string
 *                       description: "Only present for charities"
 *                     needsStatement:
 *                       type: string
 *                       example: "We urgently need non-perishable food items"
 *                       description: "Only present for charities"
 *                     transportationMode:
 *                       type: string
 *                       enum: [car, bicycle, motorcycle, public_transport, walking, other]
 *                       example: "car"
 *                       description: "Only present for volunteers"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get('/me', protect, getMe);

export default router;
