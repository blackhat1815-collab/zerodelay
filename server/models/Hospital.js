import mongoose from 'mongoose';

const hospitalSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: {
      type: String,
      default: 'India'
    }
  },
  location: {
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
  phone: {
    type: String,
    required: true
  },
  emergencyPhone: String,
  email: String,
  type: {
    type: String,
    enum: ['Government', 'Private', 'Clinic', 'Trauma Center'],
    default: 'Private'
  },
  specialties: [String],
  hasEmergencyServices: {
    type: Boolean,
    default: true
  },
  hasAmbulance: {
    type: Boolean,
    default: false
  },
  operatingHours: {
    type: String,
    default: '24/7'
  },
  rating: {
    type: Number,
    min: 0,
    max: 5
  },
  isVerified: {
    type: Boolean,
    default: false
  }
});

hospitalSchema.index({ location: '2dsphere' });

export default mongoose.model('Hospital', hospitalSchema);
