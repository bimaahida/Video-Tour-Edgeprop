import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import * as path from 'path';
import * as fs from 'fs';

import { AppsConfig } from '../config/apps-config';

// Maximum file size (50MB)
const MAX_FILE_SIZE = AppsConfig.maxFileSize;

// Create uploads directory if it doesn't exist
const UPLOAD_DIR = process.env.UPLOAD_DIRECTORY || './uploads';
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    // Create a unique filename with timestamp and original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter to only accept video files
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept video/* mime types
  if (file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only video files are allowed'));
  }
};

// Create multer upload instance
export const uploadMiddleware = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE // 50MB
  }
});

// Error handler for multer errors
export const handleMulterError = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    // A Multer error occurred when uploading
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: `File too large. Maximum size is ${Math.floor(MAX_FILE_SIZE / (1024 * 1024))}MB`
      });
    }
    return res.status(400).json({ error: err.message });
  } else if (err) {
    // An unknown error occurred
    return res.status(400).json({ error: err.message });
  }
  
  // No error, continue
  next();
};

// Cleanup function to remove temporary files after processing
export const cleanupUploadedFile = (filePath: string) => {
  if (fs.existsSync(filePath)) {
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error(`Failed to delete temporary file ${filePath}:`, err);
      }
    });
  }
};