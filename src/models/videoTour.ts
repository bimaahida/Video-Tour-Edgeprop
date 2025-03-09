import { z } from 'zod';

// Input validation schema for creating a video tour
export const VideoTourSchema = z.object({
  listing_id: z.string().min(1, 'Lsting_id is required'),
  name: z.string().min(1, 'Video name is required').max(100, 'Video name cannot exceed 100 characters'),
  link_embed: z.string().url('Valid URL is required'),
  platform: z.enum(['reels', 'tiktok', 'short'], {
    errorMap: () => ({ message: 'Platform must be one of: reels, tiktok, short' }),
  }),
});

export type VideoTourInput = z.infer<typeof VideoTourSchema>;

// Response type with all fields
export interface VideoTourResponse {
  id: string;
  listing_id: string;
  user_id: string;
  name: string;
  link_embed: string;
  thumbnail_url: string;
  created_at: string;
  platform: 'reels' | 'tiktok' | 'short';
  points_cost: number;
}

// Count type for checking video limits
export interface VideoCountResponse {
  count: number;
}

export interface pagination {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

export interface VideoTourResponses {
  data: VideoTourResponse[];
  pagination: pagination;

}