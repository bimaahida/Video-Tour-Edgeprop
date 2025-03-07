import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

/**
 * Global error handler middleware
 */
export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const statusCode = err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Log the error for debugging
  console.error(`[Error] ${err.name}: ${err.message}`);
  if (err.stack && !isProduction) {
    console.error(err.stack);
  }
  
  // Create the error response
  const errorResponse: Record<string, any> = {
    error: {
      message: err.message || 'Internal server error'
    }
  };
  
  // Add stack trace in development environment only
  if (!isProduction && err.stack) {
    errorResponse.error.stack = err.stack;
  }
  
  res.status(statusCode).json(errorResponse);
}

/**
 * Not found middleware for handling 404 errors
 */
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: {
      message: `Route not found: ${req.method} ${req.originalUrl}`
    }
  });
}

/**
 * Custom error creator
 */
export function createError(message: string, statusCode: number): AppError {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
}