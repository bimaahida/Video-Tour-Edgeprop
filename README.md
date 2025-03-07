# Video Tour API

A NodeJS + TypeScript API for managing video tours from social media platforms (Instagram Reels, TikTok, and YouTube Shorts). This API allows users to create video tours, generate GIF thumbnails, and manage their point balances.

## Features

- User authentication via Supabase
- Creating video tours from social media embed links
- Generating GIF thumbnails from videos
- Storing thumbnails in Supabase Storage
- User points system with configurable costs
- Enforcing video count limits per user

## Tech Stack

- Node.js
- TypeScript
- Express.js
- Supabase (Authentication, Database, Storage)

## API Endpoints

- `POST /api/video-tours`: Create a new video tour
- `GET /api/video-tours`: Get all video tours for the current user
- `GET /api/video-tours/:id`: Get a specific video tour
- `DELETE /api/video-tours/:id`: Delete a video tour

## Getting Started

### Prerequisites

- Node.js (v16.x or later)
- npm or yarn
- Supabase account

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_api_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# App Configuration
PORT=3000
NODE_ENV=development

# Video Tour Configuration
MAX_VIDEOS_PER_USER=10
DEFAULT_COST_POINTS=5

# Base url Edgeprop API
EDGEPROP_URL=https://www.edgeprop.sg
EDGEPROP_POINT_URL=https://point.edgeprop.sg
```

### Supabase Setup

1. Create a new Supabase project
2. Create the required tables (video_tours)
3. Enable Supabase Storage and create a bucket named 'thumbnails'
4. Configure authentication and storage permissions

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Build the project:
   ```
   npm run build
   ```
4. Start the server:
   ```
   npm start
   ```

For development with hot-reloading:
```
npm run dev
```

## Flow

1. User submits a video tour creation request with social media embed link
2. System checks if user has reached video count limit
3. System checks if user has enough points
5. System deducts points from user's balance
6. System stores the video tour information in the database

## License

MIT