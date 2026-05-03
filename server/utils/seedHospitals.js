// Run this script to seed sample hospitals: node utils/seedHospitals.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

const hospitalSchema = new mongoose.Schema({
  name: String,
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: String
  },
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number]
  },
  phone: String,
  emergencyPhone: String,
  type: String,
  specialties: [String],
  hasEmergencyServices: Boolean,
  hasAmbulance: Boolean,
  operatingHours: String,
  isVerified: Boolean
});

hospitalSchema.index({ location: '2dsphere' });
const Hospital = mongoose.model('Hospital', hospitalSchema);

const hospitals = [
  {
    name: 'AIIMS Delhi',
    address: { street: 'Sri Aurobindo Marg', city: 'New Delhi', state: 'Delhi', pincode: '110029', country: 'India' },
    location: { type: 'Point', coordinates: [77.2088, 28.5672] },
    phone: '011-26588500',
    emergencyPhone: '011-26588700',
    type: 'Government',
    specialties: ['Cardiology', 'Neurology', 'Trauma', 'Oncology'],
    hasEmergencyServices: true,
    hasAmbulance: true,
    operatingHours: '24/7',
    isVerified: true
  },
  {
    name: 'Safdarjung Hospital',
    address: { street: 'Ring Road', city: 'New Delhi', state: 'Delhi', pincode: '110029', country: 'India' },
    location: { type: 'Point', coordinates: [77.2066, 28.5685] },
    phone: '011-26707437',
    emergencyPhone: '011-26707444',
    type: 'Government',
    specialties: ['General Surgery', 'Orthopedics', 'Emergency Medicine'],
    hasEmergencyServices: true,
    hasAmbulance: true,
    operatingHours: '24/7',
    isVerified: true
  },
  {
    name: 'Max Super Speciality Hospital',
    address: { street: 'Saket', city: 'New Delhi', state: 'Delhi', pincode: '110017', country: 'India' },
    location: { type: 'Point', coordinates: [77.2177, 28.5275] },
    phone: '011-26515050',
    emergencyPhone: '011-26515051',
    type: 'Private',
    specialties: ['Cardiology', 'Oncology', 'Neurosciences', 'Orthopedics'],
    hasEmergencyServices: true,
    hasAmbulance: true,
    operatingHours: '24/7',
    isVerified: true
  },
  {
    name: 'Fortis Hospital',
    address: { street: 'Vasant Kunj', city: 'New Delhi', state: 'Delhi', pincode: '110070', country: 'India' },
    location: { type: 'Point', coordinates: [77.1566, 28.5245] },
    phone: '011-42776222',
    emergencyPhone: '011-42776333',
    type: 'Private',
    specialties: ['Cardiac Sciences', 'Orthopedics', 'Neurosciences'],
    hasEmergencyServices: true,
    hasAmbulance: true,
    operatingHours: '24/7',
    isVerified: true
  },
  {
    name: 'Apollo Hospital',
    address: { street: 'Mathura Road', city: 'New Delhi', state: 'Delhi', pincode: '110076', country: 'India' },
    location: { type: 'Point', coordinates: [77.2821, 28.5421] },
    phone: '011-71791090',
    emergencyPhone: '011-71791099',
    type: 'Private',
    specialties: ['Cardiology', 'Transplants', 'Oncology', 'Emergency Medicine'],
    hasEmergencyServices: true,
    hasAmbulance: true,
    operatingHours: '24/7',
    isVerified: true
  },
  {
    name: 'Sir Ganga Ram Hospital',
    address: { street: 'Rajinder Nagar', city: 'New Delhi', state: 'Delhi', pincode: '110060', country: 'India' },
    location: { type: 'Point', coordinates: [77.1833, 28.6417] },
    phone: '011-25750000',
    emergencyPhone: '011-42251111',
    type: 'Private',
    specialties: ['Liver Transplant', 'Cardiology', 'Nephrology'],
    hasEmergencyServices: true,
    hasAmbulance: true,
    operatingHours: '24/7',
    isVerified: true
  },
  // Mumbai Hospitals
  {
    name: 'Lilavati Hospital',
    address: { street: 'Bandra Reclamation', city: 'Mumbai', state: 'Maharashtra', pincode: '400050', country: 'India' },
    location: { type: 'Point', coordinates: [72.8370, 19.0508] },
    phone: '022-26751000',
    emergencyPhone: '022-26568000',
    type: 'Private',
    specialties: ['Cardiology', 'Neurology', 'Oncology'],
    hasEmergencyServices: true,
    hasAmbulance: true,
    operatingHours: '24/7',
    isVerified: true
  },
  {
    name: 'Kokilaben Hospital',
    address: { street: 'Andheri West', city: 'Mumbai', state: 'Maharashtra', pincode: '400053', country: 'India' },
    location: { type: 'Point', coordinates: [72.8296, 19.1308] },
    phone: '022-30999999',
    emergencyPhone: '022-30999888',
    type: 'Private',
    specialties: ['Robotic Surgery', 'Oncology', 'Transplants'],
    hasEmergencyServices: true,
    hasAmbulance: true,
    operatingHours: '24/7',
    isVerified: true
  },
  // Bangalore Hospitals
  {
    name: 'Manipal Hospital',
    address: { street: 'HAL Airport Road', city: 'Bangalore', state: 'Karnataka', pincode: '560017', country: 'India' },
    location: { type: 'Point', coordinates: [77.6467, 12.9592] },
    phone: '080-25024444',
    emergencyPhone: '080-25024455',
    type: 'Private',
    specialties: ['Cardiology', 'Oncology', 'Transplants'],
    hasEmergencyServices: true,
    hasAmbulance: true,
    operatingHours: '24/7',
    isVerified: true
  },
  {
    name: 'Narayana Health',
    address: { street: 'Bommasandra', city: 'Bangalore', state: 'Karnataka', pincode: '560099', country: 'India' },
    location: { type: 'Point', coordinates: [77.7125, 12.8163] },
    phone: '080-71222222',
    emergencyPhone: '080-71222233',
    type: 'Private',
    specialties: ['Cardiac Surgery', 'Transplants', 'Oncology'],
    hasEmergencyServices: true,
    hasAmbulance: true,
    operatingHours: '24/7',
    isVerified: true
  }
];

async function seedHospitals() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zerodelay');
    console.log('Connected to MongoDB');

    await Hospital.deleteMany({});
    console.log('Cleared existing hospitals');

    await Hospital.insertMany(hospitals);
    console.log(`Seeded ${hospitals.length} hospitals`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding hospitals:', error);
    process.exit(1);
  }
}

seedHospitals();
