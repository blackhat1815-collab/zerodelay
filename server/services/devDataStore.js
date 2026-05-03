import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '..', 'data');
const contactsPath = path.join(dataDir, 'dev-contacts.json');
const emergenciesPath = path.join(dataDir, 'dev-emergencies.json');

export const sampleHospitals = [
  {
    _id: 'aiims-delhi',
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
    isVerified: true,
  },
  {
    _id: 'safdarjung-hospital',
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
    isVerified: true,
  },
  {
    _id: 'max-saket',
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
    isVerified: true,
  },
  {
    _id: 'apollo-delhi',
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
    isVerified: true,
  },
  {
    _id: 'manipal-bangalore',
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
    isVerified: true,
  },
];

async function readJson(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

async function writeJson(filePath, data) {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

export function calculateDistance(lat1, lon1, lat2, lon2) {
  const radius = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(radius * c * 10) / 10;
}

export function getDevNearbyHospitals(latitude, longitude, limit = 10) {
  const lat = parseFloat(latitude);
  const lon = parseFloat(longitude);

  return sampleHospitals
    .map((hospital) => ({
      ...hospital,
      distance: calculateDistance(lat, lon, hospital.location.coordinates[1], hospital.location.coordinates[0]),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, parseInt(limit, 10));
}

export async function getDevContacts(userId) {
  const contacts = await readJson(contactsPath);
  return contacts
    .filter((contact) => contact.user === userId)
    .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || new Date(b.createdAt) - new Date(a.createdAt));
}

export async function addDevContact(userId, data) {
  const contacts = await readJson(contactsPath);

  if (data.isPrimary) {
    contacts.forEach((contact) => {
      if (contact.user === userId) {
        contact.isPrimary = false;
      }
    });
  }

  const contact = {
    _id: randomUUID(),
    user: userId,
    name: data.name,
    phone: data.phone,
    email: data.email || '',
    relationship: data.relationship || 'Family',
    isPrimary: Boolean(data.isPrimary),
    notifyBySMS: data.notifyBySMS !== false,
    notifyByEmail: data.notifyByEmail !== false,
    createdAt: new Date().toISOString(),
  };

  contacts.push(contact);
  await writeJson(contactsPath, contacts);
  return contact;
}

export async function updateDevContact(userId, contactId, data) {
  const contacts = await readJson(contactsPath);
  const index = contacts.findIndex((contact) => contact._id === contactId && contact.user === userId);

  if (index === -1) {
    return null;
  }

  if (data.isPrimary) {
    contacts.forEach((contact) => {
      if (contact.user === userId && contact._id !== contactId) {
        contact.isPrimary = false;
      }
    });
  }

  contacts[index] = { ...contacts[index], ...data, _id: contactId, user: userId };
  await writeJson(contactsPath, contacts);
  return contacts[index];
}

export async function deleteDevContact(userId, contactId) {
  const contacts = await readJson(contactsPath);
  const nextContacts = contacts.filter((contact) => !(contact._id === contactId && contact.user === userId));

  if (nextContacts.length === contacts.length) {
    return false;
  }

  await writeJson(contactsPath, nextContacts);
  return true;
}

export async function createDevEmergency(userId, data) {
  const emergencies = await readJson(emergenciesPath);
  const hospitals = getDevNearbyHospitals(data.latitude, data.longitude, 5).map((hospital) => ({
    name: hospital.name,
    address: `${hospital.address.street}, ${hospital.address.city}`,
    phone: hospital.emergencyPhone || hospital.phone,
    distance: hospital.distance,
    coordinates: hospital.location.coordinates,
  }));

  const emergency = {
    _id: randomUUID(),
    user: userId,
    type: data.type || 'Medical',
    status: 'Active',
    description: data.description || '',
    voiceTranscript: data.voiceTranscript || '',
    location: {
      type: 'Point',
      coordinates: [data.longitude, data.latitude],
    },
    contactsNotified: data.contactsNotified || [],
    nearbyHospitals: hospitals,
    timeline: [
      { event: 'Emergency triggered', timestamp: new Date().toISOString() },
      {
        event: `${(data.contactsNotified || []).filter((item) => item.status === 'Sent').length} contacts notified, ${(data.contactsNotified || []).filter((item) => item.status === 'Mocked').length} mocked`,
        timestamp: new Date().toISOString(),
      },
    ],
    createdAt: new Date().toISOString(),
  };

  emergencies.push(emergency);
  await writeJson(emergenciesPath, emergencies);
  return emergency;
}

export async function getDevEmergencies(userId) {
  const emergencies = await readJson(emergenciesPath);
  return emergencies
    .filter((emergency) => emergency.user === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export async function getDevEmergency(userId, emergencyId) {
  const emergencies = await readJson(emergenciesPath);
  return emergencies.find((emergency) => emergency._id === emergencyId && emergency.user === userId) || null;
}

export async function updateDevEmergencyStatus(userId, emergencyId, status) {
  const emergencies = await readJson(emergenciesPath);
  const index = emergencies.findIndex((emergency) => emergency._id === emergencyId && emergency.user === userId);

  if (index === -1) {
    return null;
  }

  emergencies[index].status = status;
  emergencies[index].timeline.push({ event: `Status changed to ${status}`, timestamp: new Date().toISOString() });

  if (status === 'Resolved') {
    emergencies[index].resolvedAt = new Date().toISOString();
  }

  await writeJson(emergenciesPath, emergencies);
  return emergencies[index];
}
