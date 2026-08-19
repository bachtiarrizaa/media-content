import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { ErrorHandler } from '../utils/error.utils';

export const errorMiddleware = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.flatten().fieldErrors,
    });
    return;
  }

  if (error instanceof ErrorHandler) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
    return;
  }

  console.error('[ERROR]', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
};
