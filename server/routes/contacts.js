import express from 'express';
import { getContacts, addContact, updateContact, deleteContact } from '../controllers/contactController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getContacts)
  .post(addContact);

router.route('/:id')
  .put(updateContact)
  .delete(deleteContact);

export default router;
