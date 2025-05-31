import { User, Donor, Volunteer, Admin, Charity } from '../models/User.js';
import generateToken from '../utils/generateToken.js';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    const { name, email, password, role, ...otherDetails } = req.body;

    if (!name || !email || !password || !role) {
        return res.status(400).json({ message: 'Please provide name, email, password, and role' });
    }

    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        let newUser;
        const userData = { name, email, password, role, ...otherDetails };

        switch (role.toLowerCase()) {
            case 'donor':
                newUser = new Donor(userData);
                break;
            case 'volunteer':
                newUser = new Volunteer(userData);
                break;
            case 'admin':
                // TODO: Consider protecting admin creation more robustly in a real app
                newUser = new Admin(userData);
                break;
            case 'charity':
                if (!otherDetails.charityName) {
                     return res.status(400).json({ message: 'Charity name is required for charity role' });
                }
                newUser = new Charity(userData);
                break;
            default:
                return res.status(400).json({ message: 'Invalid user role specified' });
        }

        await newUser.save();

        if (newUser) {
            const response = {
                _id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                userType: newUser.userType,
                isVerified: newUser.isVerified,
                token: generateToken(newUser._id, newUser.role),
            };

            if ((newUser.role === 'volunteer' || newUser.role === 'charity') && !newUser.isVerified) {
                response.message = 'Your account has been created and is pending approval by an administrator. You will be notified when your account is verified.';
                response.isPending = true;
            }

            res.status(201).json(response);
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error('Error during user registration:', error);
        res.status(500).json({ message: 'Server error during registration', error: error.message });
    }
};

// @desc    Authenticate user & get token (Login)
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Please provide email and password' });
    }

    try {
        const user = await User.findOne({ email }).select('+password');

        if (user && (await user.matchPassword(password))) {
            if ((user.role === 'volunteer' || user.role === 'charity') && !user.isVerified) {
                return res.status(403).json({
                    message: 'Your account is pending approval. Please wait for an administrator to verify your account.',
                    isPending: true
                });
            }

            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                userType: user.userType,
                isVerified: user.isVerified,
                token: generateToken(user._id, user.role),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error('Error during user login:', error);
        res.status(500).json({ message: 'Server error during login', error: error.message });
    }
};

// @desc    Verify a user (approve or reject)
// @route   PUT /api/auth/verify/:id
// @access  Private/Admin
const verifyUser = async (req, res) => {
    try {
        const { approve } = req.body;

        if (approve === undefined) {
            return res.status(400).json({ message: 'Please specify whether to approve or reject the user' });
        }

        const userId = req.params.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.role !== 'volunteer' && user.role !== 'charity') {
            return res.status(400).json({ message: 'Only volunteers and charities require verification' });
        }

        user.isVerified = approve;

        if (user.role === 'volunteer' || user.role === 'charity') {
            let specificUser;

            if (user.role === 'volunteer') {
                specificUser = await Volunteer.findById(userId);
            } else if (user.role === 'charity') {
                specificUser = await Charity.findById(userId);
            }

            if (specificUser) {
                specificUser.verificationStatus = approve ? 'verified' : 'rejected';
                specificUser.verifiedBy = req.user._id; // Current admin's ID from auth middleware
                await specificUser.save();
            }
        }

        await user.save();

        res.json({
            message: `User ${approve ? 'approved' : 'rejected'} successfully`,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isVerified: user.isVerified
            }
        });
    } catch (error) {
        console.error('Error during user verification:', error);
        res.status(500).json({ message: 'Server error during verification', error: error.message });
    }
};

// @desc    Get all users pending verification
// @route   GET /api/auth/pending-verification
// @access  Private/Admin
const getUsersPendingVerification = async (req, res) => {
    try {
        const pendingUsers = await User.find({
            isVerified: false,
            role: { $in: ['volunteer', 'charity'] }
        }).select('-password');

        res.json(pendingUsers);
    } catch (error) {
        console.error('Error fetching pending users:', error);
        res.status(500).json({ message: 'Server error fetching pending users', error: error.message });
    }
};

export { registerUser, loginUser, verifyUser, getUsersPendingVerification };
