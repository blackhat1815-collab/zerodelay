import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Please provide contact name'],
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Please provide phone number']
  },
  email: {
    type: String,
    lowercase: true
  },
  relationship: {
    type: String,
    enum: ['Family', 'Friend', 'Doctor', 'Other'],
    default: 'Family'
  },
  isPrimary: {
    type: Boolean,
    default: false
  },
  notifyBySMS: {
    type: Boolean,
    default: true
  },
  notifyByEmail: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Contact', contactSchema);
