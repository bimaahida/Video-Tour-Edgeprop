CREATE TABLE video_tours (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT NOT NULL,
    listing_id TEXT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    storage_path VARCHAR(255) NOT NULL,
    video_url TEXT NOT NULL,
    gif_url TEXT NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    title VARCHAR(255) DEFAULT '',
    instagram VARCHAR(255) DEFAULT '',
    tiktok VARCHAR(255) DEFAULT '',
    youtube VARCHAR(255) DEFAULT '',
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security on video_tours
ALTER TABLE video_tours ENABLE ROW LEVEL SECURITY;

-- Create index on user_id for faster querying
CREATE INDEX idx_video_tours_user_id ON video_tours(user_id);