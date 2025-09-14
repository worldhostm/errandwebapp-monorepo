import { Request, Response } from 'express';

interface CustomError extends Error {
  statusCode?: number;
  status?: number;
}

export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response
) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error(err);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { name: 'CastError', message, statusCode: 404 };
  }

  // Mongoose duplicate key
  if (err.name === 'MongoServerError' && 'code' in err && (err as { code: number }).code === 11000) {
    const message = 'Duplicate field value entered';
    error = { name: 'MongoServerError', message, statusCode: 400 };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values((err as { errors: Record<string, { message: string }> }).errors).map(val => val.message).join(', ');
    error = { name: 'ValidationError', message, statusCode: 400 };
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error'
  });
};