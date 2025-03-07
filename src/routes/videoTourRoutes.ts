import express from 'express';
import * as videoTourController from '../controllers/videoTourController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Video tour routes
router.post('/', videoTourController.createVideoTour);
router.get('/', videoTourController.getUserVideoTours);
router.get('/:id', videoTourController.getVideoTourById);
router.delete('/:id', videoTourController.deleteVideoTour);

export default router;