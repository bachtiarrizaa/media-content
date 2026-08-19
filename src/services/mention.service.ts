import { BulkIngestDto } from '../dtos/mention.dto';
import { MentionRepository } from '../repositories/mention.repository';
import { Mention, MentionFilters } from '../types/mention';
import { PaginationQuery } from '../types/pagination';
import { PaginationUtils } from '../utils/pagination.utils';
import { NormalizeService } from './normalize.service';

export class MentionService {
  static async bulkIngest(rawMentions: BulkIngestDto) {
    const normalized = rawMentions.map((raw) => NormalizeService.normalize(raw));

    const uniqueMap = new Map<string, Omit<Mention, 'id' | 'created_at' | 'updated_at'>>();
    for (const item of normalized) {
      uniqueMap.set(item.normalized_url, item);
    }
    const deduped = Array.from(uniqueMap.values());

    const { inserted, updated } = await MentionRepository.upsertBulk(deduped);

    return {
      received: rawMentions.length,
      duplicatesInPayload: rawMentions.length - deduped.length,
      inserted,
      updated,
    };
  }

  static async search(
    filters: MentionFilters,
    paginationQuery: PaginationQuery,
    sortBy: string = 'published_at',
    sortOrder: 'asc' | 'desc' = 'desc',
  ) {
    const { page, limit, offset } = PaginationUtils.paginate(paginationQuery);

    const activeFilters = { ...filters };

    if (activeFilters.source) {
      activeFilters.source = NormalizeService.normalizeSource(activeFilters.source);
    }

    if (activeFilters.from && /^\d{4}-\d{2}-\d{2}$/.test(activeFilters.from)) {
      activeFilters.from = `${activeFilters.from}T00:00:00.000Z`;
    }

    if (activeFilters.to && /^\d{4}-\d{2}-\d{2}$/.test(activeFilters.to)) {
      activeFilters.to = `${activeFilters.to}T23:59:59.999Z`;
    }

    const [data, total] = await Promise.all([
      MentionRepository.findMentions(limit, offset, activeFilters, sortBy, sortOrder),
      MentionRepository.countMentions(activeFilters),
    ]);

    const pagination = PaginationUtils.calculatePaginationMeta(page, limit, total);

    return { data, pagination };
  }

  static async getStats(groupBy: 'source' | 'day') {
    const rows = await MentionRepository.getStats(groupBy);
    return rows.map((row) => ({
      label: row.label,
      count: Number(row.count),
    }));
  }
}
