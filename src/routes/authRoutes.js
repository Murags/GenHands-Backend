import express from 'express';
import { registerUser, loginUser, verifyUser, getUsersPendingVerification, getUsers } from '../controllers/authController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication and registration
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
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
 *                 example: Jane Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: jane@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *               role:
 *                 type: string
 *                 enum: [donor, volunteer, admin, charity]
 *                 example: volunteer
 *     responses:
 *       201:
 *         description: User registered successfully
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
 *                 message: {
 *                   type: string,
 *                   description: Verification message for volunteers/charities
 *                 }
 *                 isPending: {
 *                   type: boolean,
 *                   description: Flag indicating if verification is pending
 *                 }
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Server error
 */
router.post('/register', registerUser);

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
router.put('/verify/:id', verifyUser); /* Add protect and admin middleware */

export default router;
