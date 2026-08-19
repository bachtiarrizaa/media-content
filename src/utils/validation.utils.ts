import type { Response } from 'express';
import type { ZodError } from 'zod';
import { z } from 'zod';

export class ValidationUtils {
  static request(res: Response, error: ZodError) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: error.flatten().fieldErrors,
    });
  }

  static id(res: Response, id: string): string | null {
    const parsed = z.string().uuid().safeParse(id);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        message: 'Invalid ID format',
      });
      return null;
    }
    return parsed.data;
  }
}
