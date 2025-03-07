import dotenv from 'dotenv';

dotenv.config();

export const AppsConfig = {
  defaultCostPoint: Number(process.env.DEFAULT_COST_POINTS) || 5,
  maxVideoPerUser: Number(process.env.MAX_VIDEOS_PER_USER) || 10,
};
