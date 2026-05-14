import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '@/types';

export class ApiError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('Error:', err);

  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      statusCode: err.statusCode,
    } as ApiResponse);
    return;
  }

  if (err.name === 'ZodError') {
    res.status(400).json({
      success: false,
      message: 'Validation error',
      error: err.errors,
      statusCode: 400,
    } as ApiResponse);
    return;
  }

  res.status(500).json({
    success: false,
    message: 'Internal server error',
    statusCode: 500,
  } as ApiResponse);
};

export const notFound = (_req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    statusCode: 404,
  } as ApiResponse);
};
