import User from '../models/User.js';
import validator from 'validator';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import {
  createDevUser,
  findDevUserById,
  updateDevUser,
  verifyDevUser
} from '../services/devAuthStore.js';

const isDatabaseConnected = () => mongoose.connection.readyState === 1;

// @desc    Register user
// @route   POST /api/auth/register
export const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, bloodGroup, medicalConditions, allergies } = req.body;
    const normalizedPhone = phone?.replace(/[\s().-]/g, '');

    // Validation
    if (!validator.isEmail(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email' });
    }

    if (!validator.isMobilePhone(normalizedPhone || '', 'any')) {
      return res.status(400).json({ success: false, message: 'Invalid phone number' });
    }

    if (!isDatabaseConnected()) {
      const user = await createDevUser({
        name,
        email,
        password,
        phone: normalizedPhone,
        bloodGroup,
        medicalConditions,
        allergies
      });
      return sendTokenResponse(user, 201, res);
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const user = await User.create({
      name,
      email,
      password,
      phone: normalizedPhone,
      bloodGroup,
      medicalConditions,
      allergies
    });

    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    if (!isDatabaseConnected()) {
      const user = await verifyDevUser(email, password);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      return sendTokenResponse(user, 200, res);
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
export const getMe = async (req, res, next) => {
  try {
    if (!isDatabaseConnected()) {
      const user = await findDevUserById(req.user.id);
      return res.json({ success: true, data: user });
    }

    const user = await User.findById(req.user.id).populate('emergencyContacts');
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
export const updateProfile = async (req, res, next) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      phone: req.body.phone,
      bloodGroup: req.body.bloodGroup,
      medicalConditions: req.body.medicalConditions,
      allergies: req.body.allergies
    };

    // Remove undefined fields
    Object.keys(fieldsToUpdate).forEach(key => 
      fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
    );

    if (!isDatabaseConnected()) {
      const user = await updateDevUser(req.user.id, fieldsToUpdate);
      return res.json({ success: true, data: user });
    }

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user location
// @route   PUT /api/auth/location
export const updateLocation = async (req, res, next) => {
  try {
    const { latitude, longitude } = req.body;
    const location = {
      type: 'Point',
      coordinates: [longitude, latitude]
    };

    if (!isDatabaseConnected()) {
      await updateDevUser(req.user.id, { location });
      return res.json({ success: true, data: location });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { location },
      { new: true }
    );

    res.json({ success: true, data: user.location });
  } catch (error) {
    next(error);
  }
};

// Helper to send token response
const sendTokenResponse = (user, statusCode, res) => {
  const id = user._id || user.id;
  const token = typeof user.getSignedJwtToken === 'function'
    ? user.getSignedJwtToken()
    : jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
      });

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      bloodGroup: user.bloodGroup
    }
  });
};
