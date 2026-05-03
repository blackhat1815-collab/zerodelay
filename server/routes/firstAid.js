import express from 'express';
import { getFirstAidGuide, firstAidChat, getConditionGuide } from '../controllers/firstAidController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/guide', protect, getFirstAidGuide);
router.post('/chat', protect, firstAidChat);
router.get('/:condition', getConditionGuide);

export default router;
