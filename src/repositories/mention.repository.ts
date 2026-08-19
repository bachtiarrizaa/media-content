import db from '../config/db.config';
import type { Mention } from '../types/mention';

const CHUNK_SIZE = 500;

export class MentionRepository {
  static async upsertBulk(
    mentions: Omit<Mention, 'id' | 'created_at' | 'updated_at'>[],
  ): Promise<{ inserted: number; updated: number }> {
    if (mentions.length === 0) return { inserted: 0, updated: 0 };

    let totalInserted = 0;
    let totalUpdated = 0;

    await db.transaction(async (trx) => {
      for (let i = 0; i < mentions.length; i += CHUNK_SIZE) {
        const chunk = mentions.slice(i, i + CHUNK_SIZE);

        const rows = await trx('mentions')
          .insert(chunk)
          .onConflict('normalized_url')
          .merge({
            external_id: db.raw('EXCLUDED.external_id'),
            source: db.raw('EXCLUDED.source'),
            source_raw: db.raw('EXCLUDED.source_raw'),
            title: db.raw('EXCLUDED.title'),
            content: db.raw('EXCLUDED.content'),
            author: db.raw('EXCLUDED.author'),
            published_at: db.raw('EXCLUDED.published_at'),
            engagement: db.raw('EXCLUDED.engagement'),
            updated_at: db.fn.now(),
          })
          .returning(db.raw('(xmax = 0) as is_inserted'));

        const inserted = rows.filter(
          (r: { is_inserted: boolean | string }) => r.is_inserted === true || r.is_inserted === 'true',
        ).length;

        totalInserted += inserted;
        totalUpdated += chunk.length - inserted;
      }
    });

    return { inserted: totalInserted, updated: totalUpdated };
  }
}
