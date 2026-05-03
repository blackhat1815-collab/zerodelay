import express from 'express';
import {
  triggerEmergency,
  getEmergency,
  updateEmergencyStatus,
  getEmergencyHistory
} from '../controllers/emergencyController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/trigger', triggerEmergency);
router.get('/history', getEmergencyHistory);
router.get('/:id', getEmergency);
router.put('/:id/status', updateEmergencyStatus);

export default router;
