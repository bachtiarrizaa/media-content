import { Request, Response, NextFunction } from 'express';
import { bulkIngestSchema } from '../validations/mention.validation';
import { MentionService } from '../services/mention.service';
import { ValidationUtils } from '../utils/validation.utils';
import { ApiResponse } from '../utils/response.utils';

export class MentionController {
  static async bulkIngest(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = bulkIngestSchema.safeParse(req.body);
      if (!parsed.success) {
        return ValidationUtils.request(res, parsed.error);
      }

      const result = await MentionService.bulkIngest(parsed.data);

      return ApiResponse.created(
        res,
        `Processed ${result.received} mentions: ${result.inserted} inserted, ${result.updated} updated`,
        result,
      );
    } catch (error) {
      next(error);
    }
  }
}
