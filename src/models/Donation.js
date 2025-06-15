import mongoose from 'mongoose';

const donationItemSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    enum: ['Food items', 'Clothing', 'Electronics', 'Books', 'Toys', 'Furniture', 'Medical supplies', 'Household items', 'Other']
  },
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  quantity: {
    type: String,
    required: true,
    maxlength: 100
  },
  condition: {
    type: String,
    required: true,
    enum: ['new', 'good', 'fair', 'poor']
  }
});

const donationSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  donorName: {
    type: String,
    required: true,
    maxlength: 255
  },
  donorPhone: {
    type: String,
    required: true,
    maxlength: 20
  },
  donorEmail: {
    type: String,
    maxlength: 255,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  organizationName: {
    type: String,
    maxlength: 255
  },
  organizationType: {
    type: String,
    enum: ['individual', 'business', 'organization', 'school', 'restaurant'],
    default: 'individual'
  },
  pickupAddress: {
    type: String,
    required: true
  },
  pickupCoordinates: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true,
      index: '2dsphere'
    }
  },
  accessNotes: {
    type: String,
    maxlength: 1000
  },
  donationItems: {
    type: [donationItemSchema],
    required: true,
    validate: [arrayLimit, 'At least one donation item is required']
  },
  totalWeight: {
    type: String,
    maxlength: 50
  },
  requiresRefrigeration: {
    type: Boolean,
    default: false
  },
  fragileItems: {
    type: Boolean,
    default: false
  },
  preferredCharity: {
    type: String,
    required: true,
    maxlength: 255
  },
  deliveryInstructions: {
    type: String,
    maxlength: 1000
  },
  availabilityType: {
    type: String,
    enum: ['flexible', 'specific', 'urgent'],
    default: 'flexible'
  },
  preferredDate: {
    type: Date
  },
  preferredTimeStart: {
    type: String,
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time in HH:MM format']
  },
  preferredTimeEnd: {
    type: String,
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time in HH:MM format']
  },
  urgencyLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  additionalNotes: {
    type: String,
    maxlength: 1000
  },
  photoConsent: {
    type: Boolean,
    default: false
  },
  contactPreference: {
    type: String,
    enum: ['phone', 'email', 'sms'],
    default: 'phone'
  },
  status: {
    type: String,
    enum: ['submitted', 'assigned', 'picked_up', 'delivered', 'cancelled'],
    default: 'submitted',
    index: true
  }
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

// Validation function for donation items array
function arrayLimit(val) {
  return val.length > 0;
}

// Compound indexes for performance
donationSchema.index({ status: 1, urgencyLevel: 1 });
donationSchema.index({ preferredCharity: 1 });
donationSchema.index({ createdAt: -1 });

const Donation = mongoose.model('Donation', donationSchema);

export default Donation;
