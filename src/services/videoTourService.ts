import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { SupabaseClient, createClient } from '@supabase/supabase-js';

import { SupabaseConfig } from '../config/supabase-config';
import { AppsConfig } from '../config/apps-config';
import { cleanupUploadedFile } from '../middleware/upload';
import { VideoCountResponse, VideoTourResponses, VideoUploadResult, VideoTourUploadInput, VideoTourUpdateInput } from '../models/videoTour';
import { generatePreview } from '../utils/previewGenerator';
import { generateThumbnail } from '../utils/thumbnailGenerator';

/**
 * Service class for handling video tour operations
 */
class VideoTourService {
  private readonly db: SupabaseClient;
  private readonly adminDb: SupabaseClient;

  constructor() {
    if (!SupabaseConfig.url || !SupabaseConfig.anonKey || !SupabaseConfig.serviceKey) {
      throw new Error('Missing Supabase credentials. Please check your .env file.');
    }

    this.db = createClient(SupabaseConfig.url, SupabaseConfig.anonKey);
    this.adminDb = createClient(SupabaseConfig.url, SupabaseConfig.serviceKey);
  }

  // /**
  //  * Create a new video tour
  //  * @param userId - The user ID
  //  * @param userPoints - Current user points balance
  //  * @param videoData - Video tour data
  //  * @returns Created video tour
  //  */
  // async createVideoTour(userId: string, userPoints: number, videoData: VideoTourInput): Promise<VideoTourResponse> {
  //   // 1. Check if user has reached video count limit
  //   const videoCount = await this.getVideoCount(userId);

  //   // 2. Check if user has enough points and process point deduction only if video count exceeds the limit
  //   if (videoCount.count >= AppsConfig.maxVideoPerUser) {
  //     // Check if user has enough points
  //     if (userPoints < AppsConfig.defaultCostPoint) {
  //       throw new Error('Insufficient points to create a video tour.');
  //     }

  //     // Process points deduction since we're exceeding the limit
  //     // await deductUserPoints(userId, this.DEFAULT_COST_POINTS);
  //   }

  //   // 3. Store in database
  //   const newVideoTour = {
  //     id: uuidv4(),
  //     user_id: userId,
  //     name: videoData.name,
  //     link_embed: videoData.link_embed,
  //     created_at: new Date().toISOString(),
  //     platform: videoData.platform,
  //     listing_id: videoData.listing_id,
  //   };

  //   const { data, error } = await this.adminDb
  //     .from('video_tours')
  //     .insert(newVideoTour)
  //     .select()
  //     .single();

  //   if (error) {
  //     throw new Error(`Failed to create video tour: ${error.message}`);
  //   }

  //   return data as VideoTourResponse;
  // }

  /**
   * Get the count of video tours for a user
   * @param userId - The user ID
   * @returns The count of video tours
   */
  async getVideoCount(userId: string): Promise<VideoCountResponse> {
    const { count, error } = await this.adminDb
      .from('video_tours')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to get video count: ${error.message}`);
    }

    return { count: count || 0 };
  }

  /**
   * Get all video tours for a user
   * @param userId - The user ID
   * @returns Array of video tours
   */
  async getUserVideoTours(listingID: string, page: number = 1, pageSize: number = 10): Promise<VideoTourResponses> {
    // Ensure valid pagination parameters
    const validPage = Math.max(1, page);
    const validPageSize = Math.min(100, Math.max(1, pageSize)); // Limit max page size to 100

    // Calculate pagination
    const from = (validPage - 1) * validPageSize;
    const to = from + validPageSize - 1;

    // Get total count first
    const { count, error: countError } = await this.adminDb
      .from('video_tours')
      .select('*', { count: 'exact', head: true })
      // .eq('user_id', userId)
      .eq('listing_id', listingID);

    if (countError) {
      throw new Error(`Failed to get video tours count: ${countError.message}`);
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / validPageSize);

    // If requested page is out of range and there are items, return last page
    const adjustedPage = (validPage > totalPages && total > 0)
      ? totalPages
      : validPage;

    const adjustedFrom = (adjustedPage - 1) * validPageSize;
    const adjustedTo = adjustedFrom + validPageSize - 1;

    // Get paginated data
    const { data, error } = await this.adminDb
      .from('video_tours')
      .select('*')
      // .eq('user_id', userId)
      .eq('listing_id', listingID)
      .order('uploaded_at', { ascending: false })
      .range(adjustedFrom, adjustedTo);

    if (error) {
      throw new Error(`Failed to get video tours: ${error.message}`);
    }

    return {
      data: data as VideoUploadResult[],
      pagination: {
        total,
        page: adjustedPage,
        pageSize: validPageSize,
        totalPages,
        hasMore: adjustedPage < totalPages
      }
    };
  }

  /**
   * Get a specific video tour by ID
   * @param id - The video tour ID
   * @param userId - The user ID
   * @returns Video tour
   */
  async getVideoTourById(id: string, userId: string): Promise<VideoUploadResult> {
    const { data, error } = await this.adminDb
      .from('video_tours')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      throw new Error(`Video tour not found: ${error.message}`);
    }

    return data as VideoUploadResult;
  }

  /**
   * Delete a video tour
   * @param id - The video tour ID
   * @param userId - The user ID
   */
  async deleteVideoTour(id: string, userId: string): Promise<void> {
    // First get the video to make sure it exists and belongs to the user
    const videoTour = await this.getVideoTourById(id, userId);

    // Delete the gif_url from storage
    if (videoTour.preview) {
      const path = videoTour.preview.split('/').pop();
      if (path) {
        const { error: storageError } = await this.adminDb.storage
          .from(AppsConfig.previewBucket)
          .remove([path]);

        if (storageError) {
          console.error(`Failed to delete preview: ${storageError.message}`);
          // Continue with deletion even if gif_url deletion fails
        }
      }
    }

    // Delete the gif_url from storage
    if (videoTour.thumbnail) {
      const path = videoTour.preview.split('/').pop();
      if (path) {
        const { error: storageError } = await this.adminDb.storage
          .from(AppsConfig.thumbnailBucket)
          .remove([path]);

        if (storageError) {
          console.error(`Failed to delete thumbnail: ${storageError.message}`);
          // Continue with deletion even if gif_url deletion fails
        }
      }
    }

    if (videoTour.video_url) {
      const path = videoTour.video_url.split('/').pop();
      if (path) {
        const { error: storageError } = await this.adminDb.storage
          .from(AppsConfig.videoBucket)
          .remove([path]);

        if (storageError) {
          console.error(`Failed to delete video_url: ${storageError.message}`);
          // Continue with deletion even if video_url deletion fails
        }
      }
    }

    // Delete the video tour from the database
    const { error } = await this.adminDb
      .from('video_tours')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to delete video tour: ${error.message}`);
    }
  }

  async uploadVideo(
    videoData: VideoTourUploadInput,
    userId: string
  ): Promise<VideoUploadResult> {
    try {
      // Generate unique filename for storage
      const fileExtension = path.extname(videoData.file.originalname);
      const storageFilename = `${uuidv4()}${fileExtension}`;

      // Get file size
      const fileStats = fs.statSync(videoData.file.path);
      const fileSize = fileStats.size;

      // Generate preview
      const { url: previewURL, path: previewPath } = await generatePreview(this.adminDb, AppsConfig.previewBucket, videoData.file.path);

      // Generate thumbnail
      const { url: thumbnailURL, path: thumbnailPath } = await generateThumbnail(this.adminDb, AppsConfig.thumbnailBucket, videoData.file.path)

      // Upload video to Supabase
      const { data: uploadData, error: uploadError } = await this.adminDb.storage
        .from(AppsConfig.videoBucket)
        .upload(storageFilename, fs.readFileSync(videoData.file.path), {
          contentType: videoData.file.mimetype,
          cacheControl: '31536000' // 1 year cache
        });

      if (uploadError) {
        throw new Error(`Failed to upload video: ${uploadError.message}`);
      }

      // Get public URL for the uploaded video
      const { data: publicUrlData } = this.adminDb.storage
        .from(AppsConfig.videoBucket)
        .getPublicUrl(storageFilename);

      // Create record in database if needed
      // This example assumes you might want to store metadata in a Supabase table
      const videoMetadata: VideoUploadResult = {
        id: uuidv4(),
        user_id: userId,
        filename: videoData.file.originalname,
        storage_path: storageFilename,
        video_url: publicUrlData.publicUrl,
        preview: previewURL,
        thumbnail: thumbnailURL,
        content_type: videoData.file.mimetype,
        file_size: fileSize,
        listing_id: videoData.body.listing_id,
        title: videoData.body.title || "",
        instagram: videoData.body.instagram || "",
        tiktok: videoData.body.tiktok || "",
        youtube: videoData.body.youtube || "",
        uploaded_at: new Date().toISOString()
      };

      const { data, error } = await this.adminDb
        .from('video_tours')
        .insert(videoMetadata)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to create video tour: ${error.message}`);
      }

      // Clean up temporary files
      cleanupUploadedFile(videoData.file.path);
      return videoMetadata;
    } catch (error) {
      // Ensure cleanup happens even if there's an error
      cleanupUploadedFile(videoData.file.path);

      throw new Error(`Video upload failed: ${(error as Error).message}`);
    }
  }

  async update(id: string, data: VideoTourUpdateInput): Promise<VideoUploadResult> {
    try {
      // Perform update in Supabase
      const { data: updatedData, error } = await this.adminDb
        .from('video_tours') // Change to your actual table name
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }

      if (!updatedData) {
        throw new Error(`Error Update`); 
      }

      return updatedData as VideoUploadResult;
    } catch (error) {
      throw new Error(`Update Video: ${(error as Error).message}`);
    }
  }
}


// Export a singleton instance
export const videoTourService = new VideoTourService();