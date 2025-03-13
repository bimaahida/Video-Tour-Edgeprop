import * as fs from 'fs';
import * as path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import { v4 as uuidv4 } from 'uuid';
import { SupabaseClient } from '@supabase/supabase-js';

import { cleanupUploadedFile } from '../middleware/upload';

interface ThumbnailGenerationResult {
    url: string;
    path: string;
}

/**
 * Generate a thumbnail from a video file
 * @param dbClient - Supabase client
 * @param bucket - Supabase storage bucket
 * @param videoPath - Path to the video file
 * @returns Promise with the thumbnail URL
 */
export async function generateThumbnail(
    dbClient: SupabaseClient,
    bucket: string,
    videoPath: string
): Promise<ThumbnailGenerationResult> {
    return new Promise((resolve, reject) => {
        try {
            const outputDir = path.dirname(videoPath);
            const thumbnailFilename = `thumbnail-${uuidv4()}.jpg`;
            const thumbnailPath = path.join(outputDir, thumbnailFilename);

            // Extract a frame from the video for thumbnail
            ffmpeg(videoPath)
                .on('start', (cmd) => {
                    console.log(`Started ffmpeg with command: ${cmd}`);
                })
                .on('end', async () => {
                    try {
                        if (!fs.existsSync(thumbnailPath)) {
                            return reject(new Error(`Thumbnail file not created at: ${thumbnailPath}`));
                        }

                        // Upload thumbnail to Supabase
                        const { data: uploadData, error: uploadError } = await dbClient.storage
                            .from(bucket)
                            .upload(thumbnailFilename, fs.readFileSync(thumbnailPath), {
                                contentType: 'image/jpeg',
                                cacheControl: '3600'
                            });

                        if (uploadError) {
                            cleanupUploadedFile(thumbnailPath);
                            return reject(new Error(`Failed to upload thumbnail: ${uploadError.message}`));
                        }

                        // Get public URL for the uploaded thumbnail
                        const { data: publicUrlData } = dbClient.storage
                            .from(bucket)
                            .getPublicUrl(thumbnailFilename);

                        cleanupUploadedFile(thumbnailPath);
                        resolve({
                            url: publicUrlData.publicUrl,
                            path: thumbnailFilename
                        });
                    } catch (error) {
                        cleanupUploadedFile(thumbnailPath);
                        reject(new Error(`Failed to process thumbnail upload: ${(error as Error).message}`));
                    }
                })
                .on('error', (err) => {
                    console.error('FFmpeg error:', err);
                    reject(new Error(`Failed to generate thumbnail: ${err.message}`));
                })
                .screenshots({
                    count: 1,
                    folder: outputDir,
                    filename: path.basename(thumbnailFilename),
                    size: '320x?', // Width 320px, height auto to maintain aspect ratio
                    timestamps: ['00:00:02'] // Take screenshot at 5 seconds
                });
        } catch (error) {
            reject(new Error(`Thumbnail generation failed: ${(error as Error).message}`));
        }
    });
}