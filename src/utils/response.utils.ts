import type { Response } from 'express';
import type { PaginationMeta } from '../types/pagination';

export class ApiResponse {
  static success<T>(res: Response, message: string, data?: T, statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      ...(data !== undefined && { data }),
    });
  }

  static created<T>(res: Response, message: string, data?: T) {
    return ApiResponse.success(res, message, data, 201);
  }

  static paginated<T>(res: Response, message: string, data: T[], pagination: PaginationMeta) {
    return res.status(200).json({
      success: true,
      message,
      data,
      pagination,
    });
  }
}
