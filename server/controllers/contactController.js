import Contact from '../models/Contact.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import {
  addDevContact,
  deleteDevContact,
  getDevContacts,
  updateDevContact
} from '../services/devDataStore.js';

const isDatabaseConnected = () => mongoose.connection.readyState === 1;

// @desc    Get all contacts
// @route   GET /api/contacts
export const getContacts = async (req, res, next) => {
  try {
    if (!isDatabaseConnected()) {
      const contacts = await getDevContacts(req.user.id);
      return res.json({ success: true, count: contacts.length, data: contacts });
    }

    const contacts = await Contact.find({ user: req.user.id }).sort({ isPrimary: -1, createdAt: -1 });
    res.json({ success: true, count: contacts.length, data: contacts });
  } catch (error) {
    next(error);
  }
};

// @desc    Add contact
// @route   POST /api/contacts
export const addContact = async (req, res, next) => {
  try {
    const { name, phone, email, relationship, isPrimary, notifyBySMS, notifyByEmail } = req.body;

    if (!isDatabaseConnected()) {
      const contact = await addDevContact(req.user.id, {
        name,
        phone,
        email,
        relationship,
        isPrimary,
        notifyBySMS,
        notifyByEmail
      });
      return res.status(201).json({ success: true, data: contact });
    }

    // If setting as primary, unset other primary contacts
    if (isPrimary) {
      await Contact.updateMany({ user: req.user.id }, { isPrimary: false });
    }

    const contact = await Contact.create({
      user: req.user.id,
      name,
      phone,
      email,
      relationship,
      isPrimary,
      notifyBySMS,
      notifyByEmail
    });

    // Add to user's emergency contacts
    await User.findByIdAndUpdate(req.user.id, {
      $push: { emergencyContacts: contact._id }
    });

    res.status(201).json({ success: true, data: contact });
  } catch (error) {
    next(error);
  }
};

// @desc    Update contact
// @route   PUT /api/contacts/:id
export const updateContact = async (req, res, next) => {
  try {
    if (!isDatabaseConnected()) {
      const contact = await updateDevContact(req.user.id, req.params.id, req.body);

      if (!contact) {
        return res.status(404).json({ success: false, message: 'Contact not found' });
      }

      return res.json({ success: true, data: contact });
    }

    let contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }

    if (contact.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // If setting as primary, unset other primary contacts
    if (req.body.isPrimary) {
      await Contact.updateMany(
        { user: req.user.id, _id: { $ne: req.params.id } },
        { isPrimary: false }
      );
    }

    contact = await Contact.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.json({ success: true, data: contact });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete contact
// @route   DELETE /api/contacts/:id
export const deleteContact = async (req, res, next) => {
  try {
    if (!isDatabaseConnected()) {
      const deleted = await deleteDevContact(req.user.id, req.params.id);

      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Contact not found' });
      }

      return res.json({ success: true, data: {} });
    }

    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({ success: false, message: 'Contact not found' });
    }

    if (contact.user.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await contact.deleteOne();

    // Remove from user's emergency contacts
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { emergencyContacts: req.params.id }
    });

    res.json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
