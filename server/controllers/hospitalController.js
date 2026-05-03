import Hospital from '../models/Hospital.js';
import mongoose from 'mongoose';
import { getDevNearbyHospitals, sampleHospitals } from '../services/devDataStore.js';

const isDatabaseConnected = () => mongoose.connection.readyState === 1;

// @desc    Get nearby hospitals
// @route   GET /api/hospitals/nearby
export const getNearbyHospitals = async (req, res, next) => {
  try {
    const { latitude, longitude, radius = 10000, limit = 10 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Please provide latitude and longitude'
      });
    }

    if (!isDatabaseConnected()) {
      const hospitals = getDevNearbyHospitals(latitude, longitude, limit);
      return res.json({ success: true, count: hospitals.length, data: hospitals });
    }

    const hospitals = await Hospital.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(radius)
        }
      }
    }).limit(parseInt(limit));

    // Calculate distances
    const hospitalsWithDistance = hospitals.map(hospital => {
      const distance = calculateDistance(
        parseFloat(latitude),
        parseFloat(longitude),
        hospital.location.coordinates[1],
        hospital.location.coordinates[0]
      );
      return {
        ...hospital.toObject(),
        distance
      };
    });

    res.json({ success: true, count: hospitals.length, data: hospitalsWithDistance });
  } catch (error) {
    next(error);
  }
};

// @desc    Search hospitals
// @route   GET /api/hospitals/search
export const searchHospitals = async (req, res, next) => {
  try {
    const { query, city, specialty } = req.query;

    if (!isDatabaseConnected()) {
      const normalizedQuery = query?.toLowerCase();
      const normalizedCity = city?.toLowerCase();
      const normalizedSpecialty = specialty?.toLowerCase();
      const hospitals = sampleHospitals.filter((hospital) => {
        const matchesQuery = !normalizedQuery || hospital.name.toLowerCase().includes(normalizedQuery);
        const matchesCity = !normalizedCity || hospital.address.city.toLowerCase().includes(normalizedCity);
        const matchesSpecialty = !normalizedSpecialty ||
          hospital.specialties.some((item) => item.toLowerCase() === normalizedSpecialty);

        return matchesQuery && matchesCity && matchesSpecialty;
      });

      return res.json({ success: true, count: hospitals.length, data: hospitals.slice(0, 20) });
    }

    const filter = {};

    if (query) {
      filter.name = { $regex: query, $options: 'i' };
    }

    if (city) {
      filter['address.city'] = { $regex: city, $options: 'i' };
    }

    if (specialty) {
      filter.specialties = { $in: [specialty] };
    }

    const hospitals = await Hospital.find(filter).limit(20);

    res.json({ success: true, count: hospitals.length, data: hospitals });
  } catch (error) {
    next(error);
  }
};

// @desc    Get hospital by ID
// @route   GET /api/hospitals/:id
export const getHospital = async (req, res, next) => {
  try {
    if (!isDatabaseConnected()) {
      const hospital = sampleHospitals.find((item) => item._id === req.params.id);

      if (!hospital) {
        return res.status(404).json({ success: false, message: 'Hospital not found' });
      }

      return res.json({ success: true, data: hospital });
    }

    const hospital = await Hospital.findById(req.params.id);

    if (!hospital) {
      return res.status(404).json({ success: false, message: 'Hospital not found' });
    }

    res.json({ success: true, data: hospital });
  } catch (error) {
    next(error);
  }
};

// Helper function
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round(R * c * 10) / 10;
}
