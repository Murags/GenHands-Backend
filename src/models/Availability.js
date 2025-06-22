import mongoose from 'mongoose';

const timeSlotSchema = new mongoose.Schema({
  startTime: {
    type: String,
    required: true,
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time in HH:MM format']
  },
  endTime: {
    type: String,
    required: true,
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time in HH:MM format']
  }
});

const availabilitySchema = new mongoose.Schema({
  volunteer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Type of availability pattern
  type: {
    type: String,
    enum: ['recurring_weekly', 'specific_dates', 'date_range', 'always_available'],
    required: true
  },

  // For recurring weekly availability
  recurringSchedule: [{
    dayOfWeek: {
      type: Number,
      min: 0, // Sunday
      max: 6, // Saturday
      required: function() { return this.type === 'recurring_weekly'; }
    },
    timeSlots: [timeSlotSchema]
  }],

  // For specific individual dates
  specificDates: [{
    date: {
      type: Date,
      required: function() { return this.type === 'specific_dates'; }
    },
    timeSlots: [timeSlotSchema]
  }],

  // For date ranges
  dateRange: {
    startDate: {
      type: Date,
      required: function() { return this.type === 'date_range'; }
    },
    endDate: {
      type: Date,
      required: function() { return this.type === 'date_range'; }
    },
    timeSlots: [timeSlotSchema],
    // Which days of the week within the range
    daysOfWeek: [{
      type: Number,
      min: 0,
      max: 6
    }]
  },

  // For always available (24/7 or with general time constraints)
  generalTimeSlots: [timeSlotSchema],

  // Additional preferences
  preferences: {
    maxPickupsPerDay: {
      type: Number,
      default: 3,
      min: 1
    },
    transportationMode: {
      type: String,
      enum: ['car', 'bicycle', 'motorcycle', 'public_transport', 'walking', 'other'],
      default: 'car'
    }
  },

  // Status
  isActive: {
    type: Boolean,
    default: true
  },

  // Temporary unavailability (overrides)
  temporaryUnavailability: [{
    startDate: Date,
    endDate: Date,
    reason: String
  }],

  // Metadata
  notes: {
    type: String,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
availabilitySchema.index({ volunteer: 1, isActive: 1 });
availabilitySchema.index({ type: 1, isActive: 1 });

// Method to check if volunteer is available at a specific date/time
availabilitySchema.methods.isAvailableAt = function(dateTime) {
  if (!this.isActive) return false;

  // Check temporary unavailability
  const checkDate = new Date(dateTime);
  for (const unavailable of this.temporaryUnavailability) {
    if (checkDate >= unavailable.startDate && checkDate <= unavailable.endDate) {
      return false;
    }
  }

  const dayOfWeek = checkDate.getDay();
  const timeString = checkDate.toTimeString().substring(0, 5); // HH:MM format

  switch (this.type) {
    case 'always_available':
      return this.generalTimeSlots.length === 0 ||
             this.generalTimeSlots.some(slot => timeString >= slot.startTime && timeString <= slot.endTime);

    case 'recurring_weekly':
      const recurringDay = this.recurringSchedule.find(day => day.dayOfWeek === dayOfWeek);
      return recurringDay && recurringDay.timeSlots.some(slot =>
        timeString >= slot.startTime && timeString <= slot.endTime
      );

    case 'specific_dates':
      const specificDate = this.specificDates.find(d =>
        d.date.toDateString() === checkDate.toDateString()
      );
      return specificDate && specificDate.timeSlots.some(slot =>
        timeString >= slot.startTime && timeString <= slot.endTime
      );

    case 'date_range':
      if (checkDate < this.dateRange.startDate || checkDate > this.dateRange.endDate) {
        return false;
      }
      if (this.dateRange.daysOfWeek.length > 0 && !this.dateRange.daysOfWeek.includes(dayOfWeek)) {
        return false;
      }
      return this.dateRange.timeSlots.some(slot =>
        timeString >= slot.startTime && timeString <= slot.endTime
      );

    default:
      return false;
  }
};

const Availability = mongoose.model('Availability', availabilitySchema);

export default Availability;
