-- Create enum type for video platforms
CREATE TYPE video_platform AS ENUM ('reels', 'tiktok', 'short');

-- Create video_tours table
CREATE TABLE video_tours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL CHECK (char_length(name) > 0 AND char_length(name) <= 100),
  link_embed TEXT NOT NULL,
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  platform video_platform NOT NULL,
  
  -- Add search index on name
  CONSTRAINT proper_name CHECK (char_length(name) > 0)
);

-- Enable Row Level Security on video_tours
ALTER TABLE video_tours ENABLE ROW LEVEL SECURITY;

-- Create index on user_id for faster querying
CREATE INDEX idx_video_tours_user_id ON video_tours(user_id);
