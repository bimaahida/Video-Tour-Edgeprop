import { z } from 'zod';

// Input validation schema for creating a video tour
// export const VideoTourSchema = z.object({
//   listing_id: z.string().min(1, 'Lsting_id is required'),
//   name: z.string().min(1, 'Video name is required').max(100, 'Video name cannot exceed 100 characters'),
//   link_embed: z.string().url('Valid URL is required'),
//   platform: z.enum(['reels', 'tiktok', 'short'], {
//     errorMap: () => ({ message: 'Platform must be one of: reels, tiktok, short' }),
//   }),
// });

// export type VideoTourInput = z.infer<typeof VideoTourSchema>;

export const VideoTourUpload = z.object({
  // The file will be validated by multer middleware, but we can add additional validations
  file: z.object({
    fieldname: z.literal('video'),
    originalname: z.string().min(1),
    encoding: z.string(),
    mimetype: z.string().startsWith('video/'),
    size: z.number().max(52428800), // 50MB in bytes
    destination: z.string(),
    filename: z.string(),
    path: z.string(),
  }).required(), // Optional because validation happens before multer adds the file

  // Optional metadata fields (can be expanded based on requirements)
  body: z.object({
    listing_id: z.string().min(1, 'Listing_id is required'),
    title: z.string().min(1).max(100).optional(),
    instagram: z.string().optional(),
    tiktok: z.string().optional(),
    youtube: z.string().optional(),
  }),
});

export type VideoTourUploadInput = z.infer<typeof VideoTourUpload>;

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
  data: VideoUploadResult[];
  pagination: pagination;
}

export interface VideoUploadResult {
  id: string;
  user_id: string
  filename: string;
  storage_path: string;
  video_url: string;
  gif_url: string;
  content_type: string;
  file_size: number;
  listing_id: string,
  title: string,
  instagram: string,
  tiktok: string,
  youtube: string,
  uploaded_at: string
}