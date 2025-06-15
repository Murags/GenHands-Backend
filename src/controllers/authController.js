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
                let volunteerDocs = [];
                if (req.files && req.files.length > 0) {
                    volunteerDocs = req.files.map(file => file.path);
                }
                userData.verificationDocuments = volunteerDocs;
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
                // Handle file uploads
                let documentPaths = [];
                if (req.files && req.files.length > 0) {
                    documentPaths = req.files.map(file => file.path);
                }
                userData.charityName = otherDetails.charityName;
                userData.category = otherDetails.category;

                let locationData = otherDetails.location;
                if (locationData && typeof locationData === 'string') {
                    try {
                        locationData = JSON.parse(locationData);
                    } catch (e) {
                        console.error('Error parsing location data from string:', e);
                        locationData = null;
                    }
                }

                if (locationData && Array.isArray(locationData.coordinates) && locationData.coordinates.length === 2) {
                    userData.location = {
                        type: 'Point',
                        coordinates: locationData.coordinates
                    };
                }

                console.log(userData);

                userData.description = otherDetails.description;
                userData.registrationNumber = otherDetails.registrationNumber;
                userData.contactFirstName = otherDetails.contactFirstName;
                userData.contactLastName = otherDetails.contactLastName;
                userData.contactEmail = otherDetails.contactEmail;
                userData.contactPhone = otherDetails.contactPhone;
                userData.verificationDocuments = documentPaths;
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

            if (newUser.role === 'volunteer' || newUser.role === 'charity') {
                response.verificationStatus = newUser.verificationStatus || 'pending';
                if (newUser.verificationStatus === 'pending') {
                    response.message = 'Your account has been created and is pending approval by an administrator. You will be notified when your account is verified.';
                    response.isPending = true;
                }
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
            if (user.role === 'volunteer' || user.role === 'charity') {
                let specificUser;
                if (user.role === 'volunteer') {
                    specificUser = await Volunteer.findById(user._id);
                } else if (user.role === 'charity') {
                    specificUser = await Charity.findById(user._id);
                }

                if (specificUser && specificUser.verificationStatus !== 'verified') {
                    const statusMessage = {
                        pending: 'Your account is pending approval. Please wait for an administrator to verify your account.',
                        rejected: 'Your account has been rejected. Please contact support for more information.',
                        in_progress: 'Your account verification is in progress. Please wait for completion.'
                    };

                    return res.status(403).json({
                        message: statusMessage[specificUser.verificationStatus] || 'Your account is not verified.',
                        verificationStatus: specificUser.verificationStatus,
                        isPending: specificUser.verificationStatus === 'pending'
                    });
                }
            }

            const response = {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                userType: user.userType,
                isVerified: user.isVerified,
                token: generateToken(user._id, user.role),
            };

            if (user.role === 'volunteer' || user.role === 'charity') {
                let specificUser;
                if (user.role === 'volunteer') {
                    specificUser = await Volunteer.findById(user._id);
                } else if (user.role === 'charity') {
                    specificUser = await Charity.findById(user._id);
                }
                if (specificUser) {
                    response.verificationStatus = specificUser.verificationStatus;
                }
            }

            res.json(response);
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
        const { action } = req.body;

        if (!action || !['approve', 'reject'].includes(action)) {
            return res.status(400).json({ message: 'Please specify action as "approve" or "reject"' });
        }

        const userId = req.params.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.role !== 'volunteer' && user.role !== 'charity') {
            return res.status(400).json({ message: 'Only volunteers and charities require verification' });
        }

        let specificUser;
        if (user.role === 'volunteer') {
            specificUser = await Volunteer.findById(userId);
        } else if (user.role === 'charity') {
            specificUser = await Charity.findById(userId);
        }

        if (!specificUser) {
            return res.status(404).json({ message: 'User profile not found' });
        }

        const newStatus = action === 'approve' ? 'verified' : 'rejected';
        specificUser.verificationStatus = newStatus;
        // specificUser.verifiedBy = req.user._id;

        user.isVerified = action === 'approve';

        await specificUser.save();
        await user.save();

        res.json({
            message: `User ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isVerified: user.isVerified,
                verificationStatus: specificUser.verificationStatus
            }
        });
    } catch (error) {
        console.error('Error during user verification:', error);
        res.status(500).json({ message: 'Server error during verification', error: error.message });
    }
};

// @desc    Get users by status and role with filtering
// @route   GET /api/auth/users
// @access  Private/Admin
const getUsers = async (req, res) => {
    try {
        const { role, status } = req.query;

        let filter = {};

        if (role && ['volunteer', 'charity', 'donor', 'admin'].includes(role.toLowerCase())) {
            filter.role = role.toLowerCase();
        }

        let users = [];

        if (!role || ['volunteer', 'charity'].includes(role?.toLowerCase())) {
            const models = [];

            if (!role || role.toLowerCase() === 'volunteer') {
                models.push({ model: Volunteer, roleName: 'volunteer' });
            }
            if (!role || role.toLowerCase() === 'charity') {
                models.push({ model: Charity, roleName: 'charity' });
            }

            for (const { model, roleName } of models) {
                let modelFilter = { role: roleName };

                if (status && ['pending', 'verified', 'rejected', 'in_progress'].includes(status.toLowerCase())) {
                    modelFilter.verificationStatus = status.toLowerCase();
                }

                const modelUsers = await model.find(modelFilter).select('-password');
                users = users.concat(modelUsers);
            }
        }

        if (!role || ['donor', 'admin'].includes(role?.toLowerCase())) {
            let baseFilter = { ...filter };

            if (!role) {
                baseFilter.role = { $in: ['donor', 'admin'] };
            }

            if (!status || status.toLowerCase() === 'verified') {
                const baseUsers = await User.find(baseFilter).select('-password');
                users = users.concat(baseUsers);
            }
        }

        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: 'Server error fetching users', error: error.message });
    }
};

// @desc    Get all users pending verification (deprecated - use getUsers instead)
// @route   GET /api/auth/pending-verification
// @access  Private/Admin
const getUsersPendingVerification = async (req, res) => {
    try {
        const { role } = req.query;
        let filter = {};

        if (role && ['volunteer', 'charity'].includes(role.toLowerCase())) {
            filter.role = role.toLowerCase();
            filter.verificationStatus = 'pending';
        } else {
            filter.role = { $in: ['volunteer', 'charity'] };
            filter.verificationStatus = 'pending';
        }

        const models = [];
        if (!role || role.toLowerCase() === 'volunteer') {
            models.push(Volunteer);
        }
        if (!role || role.toLowerCase() === 'charity') {
            models.push(Charity);
        }

        let pendingUsers = [];
        for (const model of models) {
            const modelFilter = role ? { verificationStatus: 'pending' } : filter;
            const users = await model.find(modelFilter).select('-password');
            pendingUsers = pendingUsers.concat(users);
        }

        res.json(pendingUsers);
    } catch (error) {
        console.error('Error fetching pending users:', error);
        res.status(500).json({ message: 'Server error fetching pending users', error: error.message });
    }
};

export { registerUser, loginUser, verifyUser, getUsersPendingVerification, getUsers };
