import * as fs from 'fs';
import * as path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import { v4 as uuidv4 } from 'uuid';
import { SupabaseClient } from '@supabase/supabase-js';

import { cleanupUploadedFile } from '../middleware/upload';

interface PreviewGenerationResult {
  url: string;
  path: string;
}

/**
 * Generate a preview from a video file
 * @param videoPath - Path to the video file
 * @param duration - Duration of the preview in seconds
 * @returns Promise with the preview URL
 */
export async function generatePreview(
  dbClient: SupabaseClient,
  bucket: string,
  videoPath: string,
  duration: number = 10
): Promise<PreviewGenerationResult> {
  return new Promise((resolve, reject) => {
    try {
      const outputDir = path.dirname(videoPath);
      const previewFilename = `preview-${uuidv4()}.gif`;
      const previewPath = path.join(outputDir, previewFilename);
      
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
        
        // Generate the preview
        ffmpeg(videoPath)
          .setStartTime(startTime)
          .setDuration(actualDuration)
          .outputOptions([
            '-vf', 'fps=10,scale=320:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse',
          ])
          .output(previewPath)
          .on('end', async () => {
            try {
              // Upload preview to Supabase
              const { data: uploadData, error: uploadError } = await dbClient.storage
                .from(bucket)
                .upload(previewFilename, fs.readFileSync(previewPath), {
                  contentType: 'image/gif',
                  cacheControl: '3600'
                });
                
              if (uploadError) {
                cleanupUploadedFile(previewPath);
                return reject(new Error(`Failed to upload preview: ${uploadError.message}`));
              }
              
              // Get public URL for the uploaded preview
              const { data: publicUrlData } = dbClient.storage
                .from(bucket)
                .getPublicUrl(previewFilename);
              

              cleanupUploadedFile(previewPath);
              resolve({
                url: publicUrlData.publicUrl,
                path: previewPath
              });
            } catch (error) {
              cleanupUploadedFile(previewPath);
              reject(new Error(`Failed to process preview upload: ${(error as Error).message}`));
            }
          })
          .on('error', (err) => {
            reject(new Error(`Failed to generate preview: ${err.message}`));
          })
          .run();
      });
    } catch (error) {
      reject(new Error(`preview generation failed: ${(error as Error).message}`));
    }
  });
}