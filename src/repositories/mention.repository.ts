import { Knex } from 'knex';
import db from '../config/db.config';
import type { Mention, MentionFilters } from '../types/mention';

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
          (r: { is_inserted: boolean | string }) =>
            r.is_inserted === true || r.is_inserted === 'true',
        ).length;

        totalInserted += inserted;
        totalUpdated += chunk.length - inserted;
      }
    });

    return { inserted: totalInserted, updated: totalUpdated };
  }

  private static applyFilters(query: Knex.QueryBuilder, filters?: MentionFilters) {
    if (filters?.q) {
      query.whereRaw(
        "to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, '')) @@ plainto_tsquery('english', ?)",
        [filters.q],
      );
    }

    if (filters?.source) {
      query.whereILike('source', filters.source);
    }

    if (filters?.from) {
      query.where('published_at', '>=', filters.from);
    }

    if (filters?.to) {
      query.where('published_at', '<=', filters.to);
    }

    return query;
  }

  static async countMentions(filters?: MentionFilters): Promise<number> {
    const query = db('mentions');
    this.applyFilters(query, filters);
    const result = await query.count('* as total').first();
    return Number(result?.total) || 0;
  }

  static async findMentions(
    limit: number,
    offset: number,
    filters?: MentionFilters,
    sortBy: string = 'published_at',
    sortOrder: 'asc' | 'desc' = 'desc',
  ): Promise<Mention[]> {
    const query = db('mentions');
    this.applyFilters(query, filters);
    return query
      .orderBy([
        { column: sortBy, order: sortOrder },
        { column: 'id', order: 'asc' },
      ])
      .limit(limit)
      .offset(offset);
  }
}
