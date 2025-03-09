import express from 'express';
import * as videoTourController from '../controllers/videoTourController';
import { authenticate } from '../middleware/auth';
import { handleMulterError, uploadMiddleware } from '../middleware/upload';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// Video tour routes
// router.post('/', videoTourController.createVideoTour);
router.get('/:listingID', videoTourController.getUserVideoTours);
router.get('/detail/:id', videoTourController.getVideoTourById);
router.delete('/:id', videoTourController.deleteVideoTour);

router.post(
  '/upload',
  uploadMiddleware.single('video'), // 'video' is the field name in the form
  handleMulterError,
  videoTourController.uploadVideo
);


export default router;