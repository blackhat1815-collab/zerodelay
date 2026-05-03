import express from 'express';
import { getNearbyHospitals, searchHospitals, getHospital } from '../controllers/hospitalController.js';

const router = express.Router();

router.get('/nearby', getNearbyHospitals);
router.get('/search', searchHospitals);
router.get('/:id', getHospital);

export default router;
