import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const baseOptions = {
    discriminatorKey: 'userType',
    collection: 'users',
};

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide your name'],
    },
    email: {
        type: String,
        required: [true, 'Please provide your email'],
        unique: true,
        lowercase: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Please provide a valid email address',
        ],
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: 6,
        select: false,
    },
    role: {
        type: String,
        enum: ['donor', 'volunteer', 'admin', 'charity'],
        required: [true, 'Please specify a user role'],
    },
    isVerified: {
        type: Boolean,
        default: function() {
            return this.role === 'donor' || this.role === 'admin';
        }
    },
    phoneNumber: {
        type: String,
    },
    profilePictureUrl: {
        type: String,
    },
    address: {
        type: String,
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            // required: true // Make required if location is mandatory
        },
        coordinates: {
            type: [Number],
        }
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    lastLogin: {
        type: Date,
    },
}, {
    timestamps: true,
    ...baseOptions,
});

// Pre-save middleware to hash password
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Method to compare entered password with hashed password
UserSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', UserSchema);

// Donor Schema (inherits from User)
const DonorSchema = new mongoose.Schema({});
const Donor = User.discriminator('Donor', DonorSchema);


// TODO: Adapt this schema to the needs of the volunteer, Temporary schema for testing
// Volunteer Schema (inherits from User)
const VolunteerSchema = new mongoose.Schema({
    availability: {
        type: String,
    },
    transportationMode: {
        type: String,
        enum: ['car', 'bicycle', 'motorcycle', 'public_transport', 'walking', 'other', null],
    },
    verificationStatus: {
        type: String,
        enum: ['pending', 'verified', 'rejected', 'in_progress'],
        default: 'pending',
    },
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    verificationDocuments: [{
        type: String,
    }],
    skills: [String],
    assignedTasksCount: {
        type: Number,
        default: 0
    }
});
const Volunteer = User.discriminator('Volunteer', VolunteerSchema);

// Admin Schema (inherits from User)
const AdminSchema = new mongoose.Schema({
    permissionsLevel: {
        type: Number,
        default: 1,
    },
});
const Admin = User.discriminator('Admin', AdminSchema);

// Charity Schema (inherits from User)
// Janny was here :-)
const CharitySchema = new mongoose.Schema({
  charityName: { type: String, required: true },
  category: { type: String },
  description: { type: String },
  registrationNumber: { type: String },
  contactFirstName: { type: String },
  contactLastName: { type: String },
  contactEmail: { type: String },
  contactPhone: { type: String },
  verificationDocuments: [String],
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected', 'in_progress'],
    default: 'pending'
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
});
const Charity = User.discriminator('Charity', CharitySchema);

export { User, Donor, Volunteer, Admin, Charity };
