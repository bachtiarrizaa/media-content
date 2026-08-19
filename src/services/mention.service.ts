import { MentionRepository } from '../repositories/mention.repository';
import { Mention } from '../types/mention';
import { BulkIngestDto } from '../validations/mention.validation';
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
}
