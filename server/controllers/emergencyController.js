import Emergency from '../models/Emergency.js';
import User from '../models/User.js';
import Contact from '../models/Contact.js';
import Hospital from '../models/Hospital.js';
import mongoose from 'mongoose';
import { sendEmergencySMS, sendEmergencyEmail } from '../services/notificationService.js';
import { getFirstAidSteps } from '../services/aiService.js';
import {
  createDevEmergency,
  getDevContacts,
  getDevEmergencies,
  getDevEmergency,
  updateDevEmergencyStatus
} from '../services/devDataStore.js';
import { findDevUserById } from '../services/devAuthStore.js';

const isDatabaseConnected = () => mongoose.connection.readyState === 1;

function buildManualNotification(contact, message, subject = 'Emergency Alert') {
  const phone = contact.phone?.replace(/[^\d+]/g, '');
  const whatsappPhone = phone?.replace(/^\+/, '');
  const encodedMessage = encodeURIComponent(message);
  const encodedSubject = encodeURIComponent(subject);

  return {
    contactName: contact.name,
    phone: contact.phone,
    email: contact.email,
    message,
    smsLink: phone ? `sms:${phone}?&body=${encodedMessage}` : null,
    whatsappLink: whatsappPhone ? `https://wa.me/${whatsappPhone}?text=${encodedMessage}` : null,
    emailLink: contact.email ? `mailto:${contact.email}?subject=${encodedSubject}&body=${encodedMessage}` : null
  };
}

// @desc    Trigger emergency
// @route   POST /api/emergency/trigger
export const triggerEmergency = async (req, res, next) => {
  try {
    const { latitude, longitude, type, description, voiceTranscript } = req.body;
    const lat = Number(latitude);
    const lng = Number(longitude);
    const io = req.app.get('io');

    if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180) {
      return res.status(400).json({
        success: false,
        message: 'Valid latitude and longitude are required to trigger an emergency'
      });
    }

    if (!isDatabaseConnected()) {
      const user = await findDevUserById(req.user.id);
      const contacts = await getDevContacts(req.user.id);
      const googleMapsLink = `https://www.google.com/maps?q=${lat},${lng}`;
      const message = `EMERGENCY ALERT!\n${user.name} needs help!\nLocation: ${googleMapsLink}\nType: ${type || 'Medical'}\n${description ? `Details: ${description}` : ''}`;
      const notificationResults = [];

      for (const contact of contacts) {
        if (contact.notifyBySMS && contact.phone) {
          const result = {
            contact: contact._id,
            notifiedAt: new Date(),
            method: 'SMS',
            ...buildManualNotification(contact, message)
          };

          try {
            const delivery = await sendEmergencySMS(contact.phone, message);
            result.status = delivery.mock ? 'Mocked' : 'Sent';
          } catch (error) {
            result.status = 'Failed';
          }

          notificationResults.push(result);
        }

        if (contact.notifyByEmail && contact.email) {
          const result = {
            contact: contact._id,
            notifiedAt: new Date(),
            method: 'Email',
            ...buildManualNotification(contact, message)
          };

          try {
            const delivery = await sendEmergencyEmail(contact.email, user.name, {
              type,
              description,
              location: { latitude: lat, longitude: lng },
              googleMapsLink,
              userPhone: user.phone,
              bloodGroup: user.bloodGroup,
              medicalConditions: user.medicalConditions,
              allergies: user.allergies
            });
            result.status = delivery.mock ? 'Mocked' : 'Sent';
          } catch (error) {
            result.status = 'Failed';
          }

          notificationResults.push(result);
        }
      }

      const emergency = await createDevEmergency(req.user.id, {
        latitude: lat,
        longitude: lng,
        type,
        description,
        voiceTranscript,
        contactsNotified: notificationResults
      });
      const firstAidSteps = await getFirstAidSteps(type, description || voiceTranscript);

      io.to(`user_${req.user.id}`).emit('emergency_triggered', {
        emergencyId: emergency._id,
        status: 'Active',
        hospitals: emergency.nearbyHospitals,
        contactsNotified: notificationResults,
        firstAidSteps
      });

      return res.status(201).json({
        success: true,
        data: {
          emergency,
          nearbyHospitals: emergency.nearbyHospitals,
          contactsNotified: notificationResults,
          firstAidSteps
        }
      });
    }

    // Get user with contacts
    const user = await User.findById(req.user.id).populate('emergencyContacts');

    // Find nearby hospitals. Emergency creation should still work if this lookup fails.
    let hospitals = [];
    try {
      hospitals = await Hospital.find({
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [lng, lat]
            },
            $maxDistance: 10000 // 10km radius
          }
        },
        hasEmergencyServices: true
      }).limit(5);
    } catch (error) {
      console.error('Hospital lookup failed:', error);
    }

    // Create emergency record
    const emergency = await Emergency.create({
      user: req.user.id,
      type: type || 'Medical',
      description,
      voiceTranscript,
      location: {
        type: 'Point',
        coordinates: [lng, lat]
      },
      nearbyHospitals: hospitals.map(h => ({
        name: h.name,
        address: `${h.address.street}, ${h.address.city}`,
        phone: h.emergencyPhone || h.phone,
        distance: calculateDistance(lat, lng, h.location.coordinates[1], h.location.coordinates[0]),
        coordinates: h.location.coordinates
      })),
      timeline: [{
        event: 'Emergency triggered',
        timestamp: new Date()
      }]
    });

    // Get contacts to notify
    const contacts = await Contact.find({ user: req.user.id });
    const notificationResults = [];

    // Send notifications
    const googleMapsLink = `https://www.google.com/maps?q=${lat},${lng}`;
    const message = `🚨 EMERGENCY ALERT!\n${user.name} needs help!\nLocation: ${googleMapsLink}\nType: ${type || 'Medical'}\n${description ? `Details: ${description}` : ''}`;

    for (const contact of contacts) {
      const result = { contact: contact._id, notifiedAt: new Date() };
      const manualNotification = buildManualNotification(contact, message);

      if (contact.notifyBySMS && contact.phone) {
        try {
          const delivery = await sendEmergencySMS(contact.phone, message);
          result.method = 'SMS';
          result.status = delivery.mock ? 'Mocked' : 'Sent';
          Object.assign(result, manualNotification);
        } catch (err) {
          result.method = 'SMS';
          result.status = 'Failed';
          Object.assign(result, manualNotification);
        }
        notificationResults.push({ ...result });
      }

      if (contact.notifyByEmail && contact.email) {
        try {
          const delivery = await sendEmergencyEmail(contact.email, user.name, {
            type,
            description,
            location: { latitude: lat, longitude: lng },
            googleMapsLink,
            userPhone: user.phone,
            bloodGroup: user.bloodGroup,
            medicalConditions: user.medicalConditions,
            allergies: user.allergies
          });
          notificationResults.push({
            contact: contact._id,
            notifiedAt: new Date(),
            method: 'Email',
            status: delivery.mock ? 'Mocked' : 'Sent',
            ...manualNotification
          });
        } catch (err) {
          notificationResults.push({
            contact: contact._id,
            notifiedAt: new Date(),
            method: 'Email',
            status: 'Failed',
            ...manualNotification
          });
        }
      }
    }

    // Update emergency with notification results
    emergency.contactsNotified = notificationResults;
    emergency.timeline.push({
      event: `${notificationResults.filter(n => n.status === 'Sent').length} contacts notified`,
      timestamp: new Date()
    });
    await emergency.save();

    // Get AI first aid guidance
    const firstAidSteps = await getFirstAidSteps(type, description || voiceTranscript);
    
    // Emit real-time update
    io.to(`user_${req.user.id}`).emit('emergency_triggered', {
      emergencyId: emergency._id,
      status: 'Active',
      hospitals: emergency.nearbyHospitals,
      contactsNotified: notificationResults,
      firstAidSteps
    });

    res.status(201).json({
      success: true,
      data: {
        emergency,
        nearbyHospitals: emergency.nearbyHospitals,
        contactsNotified: notificationResults,
        firstAidSteps
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get emergency status
// @route   GET /api/emergency/:id
export const getEmergency = async (req, res, next) => {
  try {
    if (!isDatabaseConnected()) {
      const emergency = await getDevEmergency(req.user.id, req.params.id);

      if (!emergency) {
        return res.status(404).json({ success: false, message: 'Emergency not found' });
      }

      return res.json({ success: true, data: emergency });
    }

    const emergency = await Emergency.findById(req.params.id)
      .populate('user', 'name phone')
      .populate('contactsNotified.contact', 'name phone');

    if (!emergency) {
      return res.status(404).json({ success: false, message: 'Emergency not found' });
    }

    // Verify ownership
    if (emergency.user._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    res.json({ success: true, data: emergency });
  } catch (error) {
    next(error);
  }
};

// @desc    Update emergency status
// @route   PUT /api/emergency/:id/status
export const updateEmergencyStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const io = req.app.get('io');

    if (!isDatabaseConnected()) {
      const emergency = await updateDevEmergencyStatus(req.user.id, req.params.id, status);

      if (!emergency) {
        return res.status(404).json({ success: false, message: 'Emergency not found' });
      }

      io.to(`user_${req.user.id}`).emit('emergency_updated', {
        emergencyId: emergency._id,
        status
      });

      return res.json({ success: true, data: emergency });
    }

    const emergency = await Emergency.findById(req.params.id);

    if (!emergency) {
      return res.status(404).json({ success: false, message: 'Emergency not found' });
    }

    if (emergency.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    emergency.status = status;
    emergency.timeline.push({
      event: `Status changed to ${status}`,
      timestamp: new Date()
    });

    if (status === 'Resolved') {
      emergency.resolvedAt = new Date();
    }

    await emergency.save();

    // Emit real-time update
    io.to(`user_${req.user.id}`).emit('emergency_updated', {
      emergencyId: emergency._id,
      status
    });

    res.json({ success: true, data: emergency });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's emergency history
// @route   GET /api/emergency/history
export const getEmergencyHistory = async (req, res, next) => {
  try {
    if (!isDatabaseConnected()) {
      const emergencies = await getDevEmergencies(req.user.id);
      return res.json({ success: true, count: emergencies.length, data: emergencies.slice(0, 20) });
    }

    const emergencies = await Emergency.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ success: true, count: emergencies.length, data: emergencies });
  } catch (error) {
    next(error);
  }
};

// Helper function to calculate distance
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round(R * c * 10) / 10; // Distance in km, rounded to 1 decimal
}
