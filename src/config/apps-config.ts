import dotenv from 'dotenv';

dotenv.config();

export const AppsConfig = {
  defaultCostPoint: Number(process.env.DEFAULT_COST_POINTS) || 25,
  maxVideoPerUser: Number(process.env.MAX_VIDEOS_PER_USER) || 2,
  maxFileSize: Number(process.env.MAX_FILE_SIZE) || 10485760, //# 10MB in bytes
  uploadDirectory: process.env.MAX_FILE_SIZE || './uploads',
  videoBucket: process.env.VIDEO_BUCKET || 'videos',
  previewBucket: process.env.PREVIEW_BUCKET || 'previews',
  thumbnailBucket: process.env.THUMBNAIL_BUCKET || 'thumbnails'
};
