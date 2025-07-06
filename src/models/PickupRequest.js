import mongoose from 'mongoose';

const pickupRequestSchema = new mongoose.Schema({
  donation: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'Donation',
    index: true
  },
  volunteer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  charity: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
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
      required: true
    }
  },
  deliveryAddress: {
    type: String
  },
  contactPerson: {
    type: String,
    required: true,
    maxlength: 255
  },
  contactPhone: {
    type: String,
    required: true,
    maxlength: 20
  },
  contactEmail: {
    type: String,
    maxlength: 255,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  items: [{
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category'
    },
    description: String,
    quantity: String,
    condition: String
  }],
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
    index: true
  },
  status: {
    type: String,
    enum: ['available', 'accepted', 'en_route_pickup', 'arrived_pickup', 'picked_up', 'en_route_delivery', 'delivered', 'cancelled'],
    default: 'available',
    index: true
  },
  metadata: {
    accessNotes: String,
    totalWeight: String,
    requiresRefrigeration: {
      type: Boolean,
      default: false
    },
    fragileItems: {
      type: Boolean,
      default: false
    },
    contactPreference: {
      type: String,
      enum: ['phone', 'email', 'sms'],
      default: 'phone'
    },
    additionalNotes: String,
    submittedAt: Date,
    acceptedAt: Date,
    completedAt: Date,
    estimatedDistance: Number, // in kilometers
    estimatedTime: Number // in minutes
  }
}, {
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' }
});

// Geospatial index for location-based queries
pickupRequestSchema.index({ pickupCoordinates: '2dsphere' });

// Compound indexes for optimized queries
pickupRequestSchema.index({ status: 1, priority: 1 });
pickupRequestSchema.index({ status: 1, createdAt: -1 });
pickupRequestSchema.index({ volunteer: 1, status: 1 });
pickupRequestSchema.index({ charity: 1 });

// Compound geospatial indexes for filtered location queries
pickupRequestSchema.index({ status: 1, pickupCoordinates: '2dsphere' });
pickupRequestSchema.index({ priority: -1, status: 1, pickupCoordinates: '2dsphere' });

// Method to calculate distance from volunteer location
pickupRequestSchema.methods.calculateDistance = function(volunteerCoordinates) {
  if (!volunteerCoordinates || !this.pickupCoordinates.coordinates) {
    return null;
  }

  const [lat1, lon1] = volunteerCoordinates;
  const [lat2, lon2] = this.pickupCoordinates.coordinates;

  // Haversine formula
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in kilometers

  return Math.round(distance * 10) / 10; // Round to 1 decimal place
};

// Method to estimate travel time (rough estimate: 30 km/h average in city)
pickupRequestSchema.methods.calculateEstimatedTime = function(distance) {
  if (!distance) return null;
  const averageSpeed = 30; // km/h
  const timeInHours = distance / averageSpeed;
  const timeInMinutes = Math.round(timeInHours * 60);
  return timeInMinutes;
};

const PickupRequest = mongoose.model('PickupRequest', pickupRequestSchema);

export default PickupRequest;
