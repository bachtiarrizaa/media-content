import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('mentions', (table) => {
    table.uuid('id').primary().defaultTo(knex.fn.uuid());
    table.string('external_id', 255).nullable();
    table.string('source', 255).notNullable();
    table.string('source_raw', 255).nullable();
    table.text('title').nullable();
    table.text('content').nullable();
    table.text('url').notNullable();
    table.text('normalized_url').notNullable().unique();
    table.string('author', 255).nullable();
    table.timestamp('published_at', { useTz: true }).nullable();
    table.integer('engagement').nullable();

    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index(['source'], 'idx_mentions_source');
    table.index(['published_at'], 'idx_mentions_published_at');
  });

  await knex.raw(`
    CREATE INDEX idx_mentions_search 
    ON mentions 
    USING GIN (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, '')));
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('mentions');
}
