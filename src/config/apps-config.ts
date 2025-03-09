import dotenv from 'dotenv';

dotenv.config();

export const AppsConfig = {
  defaultCostPoint: Number(process.env.DEFAULT_COST_POINTS) || 5,
  maxVideoPerUser: Number(process.env.MAX_VIDEOS_PER_USER) || 10,
  maxFileSize: Number(process.env.MAX_FILE_SIZE) || 52428800, //# 50MB in bytes
  uploadDirectory: process.env.MAX_FILE_SIZE || './uploads',
  videoBucket: process.env.VIDEO_BUCKET || 'videos',
  gifBucket: process.env.GIF_BUCKET || 'previews',
};
