import { Request, Response } from 'express';
import { VideoTourSchema } from '../models/videoTour';
import { videoTourService } from '../services/videoTourService';

export async function createVideoTour(req: Request, res: Response) {
  try {
    // Extract user ID from authenticated request
    const userId = req.user?.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userPoints = req.edgepropPoint?.total_amount;
    if (!userPoints) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Validate input
    const validationResult = VideoTourSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ error: validationResult.error.issues });
    }

    // Create video tour
    const newVideoTour = await videoTourService.createVideoTour(userId, userPoints, validationResult.data);

    return res.status(201).json(newVideoTour);
  } catch (error) {
    if ((error as Error).message.includes('limit reached') ||
      (error as Error).message.includes('Insufficient points')) {
      return res.status(403).json({ error: (error as Error).message });
    }

    console.error('Error creating video tour:', error);
    return res.status(500).json({ error: 'Failed to create video tour' });
  }
}

export async function getUserVideoTours(req: Request, res: Response) {
  try {
    // Extract user ID from authenticated request
    const userId = req.user?.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const { listingID } = req.params;
    if (!listingID) {
      return res.status(401).json({ error: 'Listing ID is required' });
    }

    // Extract pagination parameters from query string
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string, 10) : 10;

    // Validate pagination parameters
    if (isNaN(page) || isNaN(pageSize) || page < 1 || pageSize < 1) {
      return res.status(400).json({ error: 'Invalid pagination parameters' });
    }

    // Get user's video tours
    const videoTours = await videoTourService.getUserVideoTours(listingID, userId, page, pageSize);

    return res.status(200).json(videoTours);
  } catch (error) {
    console.error('Error fetching video tours:', error);
    return res.status(500).json({ error: 'Failed to fetch video tours' });
  }
}

export async function getVideoTourById(req: Request, res: Response) {
  try {
    // Extract user ID from authenticated request
    const userId = req.user?.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;

    // Get the specific video tour
    const videoTour = await videoTourService.getVideoTourById(id, userId);

    return res.status(200).json(videoTour);
  } catch (error) {
    if ((error as Error).message.includes('not found')) {
      return res.status(404).json({ error: 'Video tour not found' });
    }

    console.error('Error fetching video tour:', error);
    return res.status(500).json({ error: 'Failed to fetch video tour' });
  }
}

export async function deleteVideoTour(req: Request, res: Response) {
  try {
    // Extract user ID from authenticated request
    const userId = req.user?.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { id } = req.params;

    // Delete the video tour
    await videoTourService.deleteVideoTour(id, userId);

    return res.status(204).send();
  } catch (error) {
    if ((error as Error).message.includes('not found')) {
      return res.status(404).json({ error: 'Video tour not found' });
    }

    console.error('Error deleting video tour:', error);
    return res.status(500).json({ error: 'Failed to delete video tour' });
  }
}
