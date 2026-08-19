import { Request, Response, NextFunction } from 'express';
import {
  bulkIngestSchema,
  searchQuerySchema,
  statsQuerySchema,
} from '../validations/mention.validation';
import { MentionService } from '../services/mention.service';
import { ValidationUtils } from '../utils/validation.utils';
import { ApiResponse } from '../utils/response.utils';
import { MentionFilters } from '../types/mention';

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

  static async search(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = searchQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return ValidationUtils.request(res, parsed.error);
      }

      const { page, limit, sort_by, sort_order, ...filters } = parsed.data;

      const result = await MentionService.search(
        filters as MentionFilters,
        { page, limit },
        sort_by,
        sort_order,
      );

      return ApiResponse.paginated(
        res,
        'Mentions retrieved successfully',
        result.data,
        result.pagination,
      );
    } catch (error) {
      next(error);
    }
  }

  static async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = statsQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        return ValidationUtils.request(res, parsed.error);
      }

      const result = await MentionService.getStats(parsed.data.group_by);

      return ApiResponse.success(res, 'Stats retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }
}
