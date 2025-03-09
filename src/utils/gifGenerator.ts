import * as fs from 'fs';
import * as path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import { v4 as uuidv4 } from 'uuid';
import { SupabaseClient } from '@supabase/supabase-js';

import { cleanupUploadedFile } from '../middleware/upload';

interface GifGenerationResult {
  gifUrl: string;
  gifPath: string;
}

/**
 * Generate a GIF preview from a video file
 * @param videoPath - Path to the video file
 * @param duration - Duration of the GIF in seconds
 * @returns Promise with the GIF URL
 */
export async function generateGifPreview(
  dbClient: SupabaseClient,
  bucket: string,
  videoPath: string,
  duration: number = 10
): Promise<GifGenerationResult> {
  return new Promise((resolve, reject) => {
    try {
      const outputDir = path.dirname(videoPath);
      const gifFilename = `preview-${uuidv4()}.gif`;
      const gifPath = path.join(outputDir, gifFilename);
      
      // Get video information to determine start time
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
          return reject(new Error(`Failed to probe video: ${err.message}`));
        }
        
        const videoStream = metadata.streams.find(s => s.codec_type === 'video');
        if (!videoStream) {
          return reject(new Error('No video stream found'));
        }
        
        // Get video duration in seconds
        const videoDuration = metadata?.format?.duration ? metadata.format.duration: 0;
        if (videoDuration === 0) {
          return reject(new Error('Could not determine video duration'));
        }
        
        // Start at the beginning of the video, but ensure we don't exceed video length
        const startTime = 0;
        const actualDuration = Math.min(duration, videoDuration - startTime);
        
        // Generate the GIF
        ffmpeg(videoPath)
          .setStartTime(startTime)
          .setDuration(actualDuration)
          .outputOptions([
            '-vf', 'fps=10,scale=320:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse',
          ])
          .output(gifPath)
          .on('end', async () => {
            try {
              // Upload GIF to Supabase
              const { data: uploadData, error: uploadError } = await dbClient.storage
                .from(bucket)
                .upload(gifFilename, fs.readFileSync(gifPath), {
                  contentType: 'image/gif',
                  cacheControl: '3600'
                });
                
              if (uploadError) {
                cleanupUploadedFile(gifPath);
                return reject(new Error(`Failed to upload GIF: ${uploadError.message}`));
              }
              
              // Get public URL for the uploaded GIF
              const { data: publicUrlData } = dbClient.storage
                .from(bucket)
                .getPublicUrl(gifFilename);
                
              resolve({
                gifUrl: publicUrlData.publicUrl,
                gifPath: gifPath
              });
            } catch (error) {
              cleanupUploadedFile(gifPath);
              reject(new Error(`Failed to process GIF upload: ${(error as Error).message}`));
            }
          })
          .on('error', (err) => {
            reject(new Error(`Failed to generate GIF: ${err.message}`));
          })
          .run();
      });
    } catch (error) {
      reject(new Error(`GIF generation failed: ${(error as Error).message}`));
    }
  });
}