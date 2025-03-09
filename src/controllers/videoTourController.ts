import { Request, Response } from 'express';
import { VideoTourUpload } from '../models/videoTour';
import { videoTourService } from '../services/videoTourService';
import { AppsConfig } from '../config/apps-config';

// export async function createVideoTour(req: Request, res: Response) {
//   try {
//     // Extract user ID from authenticated request
//     const userId = req.user?.user?.uid;
//     if (!userId) {
//       return res.status(401).json({ error: 'Authentication required' });
//     }

//     const userPoints = req.edgepropPoint?.total_amount;
//     if (!userPoints) {
//       return res.status(401).json({ error: 'Authentication required' });
//     }

//     // Validate input
//     const validationResult = VideoTourSchema.safeParse(req.body);
//     if (!validationResult.success) {
//       return res.status(400).json({ error: validationResult.error.issues });
//     }

//     // Create video tour
//     const newVideoTour = await videoTourService.createVideoTour(userId, userPoints, validationResult.data);

//     return res.status(201).json(newVideoTour);
//   } catch (error) {
//     if ((error as Error).message.includes('limit reached') ||
//       (error as Error).message.includes('Insufficient points')) {
//       return res.status(403).json({ error: (error as Error).message });
//     }

//     console.error('Error creating video tour:', error);
//     return res.status(500).json({ error: 'Failed to create video tour' });
//   }
// }

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

export async function uploadVideo(req: Request, res: Response) {
  try {
    // Check if file exists
    if (!req.file) {
      return res.status(400).json({ error: 'No video file uploaded' });
    }

    // Validate input
    const validationResult = VideoTourUpload.safeParse({
      file: req.file, // Instead of req.body.file
      body: req.body,
    });
    if (!validationResult.success) {
      return res.status(400).json({ error: validationResult.error.issues });
    }

    // Get user ID from authenticated request
    const userId = req.user?.user?.uid;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get user point
    const userPoints = req.edgepropPoint?.total_amount;
    if (!userPoints) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // 1. Check if user has reached video count limit
    const videoCount = await videoTourService.getVideoCount(userId);

    // 2. Check if user has enough points and process point deduction only if video count exceeds the limit
    if (videoCount.count >= AppsConfig.maxVideoPerUser) {
      // Check if user has enough points
      if (userPoints < AppsConfig.defaultCostPoint) {
        throw new Error('Insufficient points to create a video tour.');
      }

      // Process points deduction since we're exceeding the limit
      // await deductUserPoints(userId, this.DEFAULT_COST_POINTS);
    }
    
    // Upload video and generate GIF
    const result = await videoTourService.uploadVideo(
      validationResult.data,
      userId
    );
    
    return res.status(201).json(result);
  } catch (error) {
    console.error('Error uploading video:', error);
    return res.status(500).json({ error: `Failed to upload video: ${(error as Error).message}` });
  }
}
