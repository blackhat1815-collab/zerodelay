import mongoose from 'mongoose';

const emergencySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['Medical', 'Accident', 'Fire', 'Crime', 'Natural Disaster', 'Other'],
    default: 'Medical'
  },
  status: {
    type: String,
    enum: ['Active', 'Responded', 'Resolved', 'Cancelled'],
    default: 'Active'
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
    },
    address: String
  },
  description: String,
  voiceTranscript: String,
  contactsNotified: [{
    contact: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contact'
    },
    notifiedAt: Date,
    method: {
      type: String,
      enum: ['SMS', 'Email', 'Push']
    },
    status: {
      type: String,
      enum: ['Sent', 'Delivered', 'Failed', 'Mocked']
    }
  }],
  nearbyHospitals: [{
    name: String,
    address: String,
    phone: String,
    distance: Number,
    coordinates: [Number]
  }],
  firstAidProvided: [{
    step: String,
    timestamp: Date,
    completed: Boolean
  }],
  timeline: [{
    event: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  resolvedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

emergencySchema.index({ location: '2dsphere' });
emergencySchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('Emergency', emergencySchema);
