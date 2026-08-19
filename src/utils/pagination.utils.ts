import { PaginationQuery, PaginationParams, PaginationMeta } from '../types/pagination';

export type { PaginationQuery, PaginationParams, PaginationMeta };

export class PaginationUtils {
  private static readonly DEFAULT_PAGE = 1;
  private static readonly DEFAULT_LIMIT = 10;

  static paginate(query: PaginationQuery): PaginationParams {
    const page = query.page || this.DEFAULT_PAGE;
    const limit = query.limit || this.DEFAULT_LIMIT;
    const offset = (page - 1) * limit;

    return { page, limit, offset };
  }

  static calculatePaginationMeta(page: number, limit: number, total: number): PaginationMeta {
    const totalPages = Math.ceil(total / limit);

    return {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }
}
