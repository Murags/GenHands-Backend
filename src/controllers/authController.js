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
            res.status(201).json({
                _id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                userType: newUser.userType, // From discriminator
                token: generateToken(newUser._id, newUser.role),
            });
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
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                userType: user.userType,
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

export { registerUser, loginUser };
