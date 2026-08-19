import knex from 'knex';
import knexConfig from '../../knexfile';
import pg from 'pg';

const env = process.env.NODE_ENV ?? 'development';
const config = knexConfig[env];

if (!config) {
  throw new Error(`Knex config not found for environment: ${env}`);
}

pg.types.setTypeParser(1082, (val) => val);
pg.types.setTypeParser(1700, (val) => parseFloat(val));

const db = knex(config);

if (env === 'development') {
  const queryStartTimes = new Map<string, number>();

  db.on('query', (query) => {
    queryStartTimes.set(query.__knexQueryUid, Date.now());
    console.log('┌─ Query:', query.sql);
    console.log('└─ Bindings:', query.bindings);
  });

  db.on('query-response', (_response, query) => {
    const start = queryStartTimes.get(query.__knexQueryUid);
    const duration = start ? Date.now() - start : 0;
    queryStartTimes.delete(query.__knexQueryUid);
    console.log(`Duration: ${duration}ms\n`);
  });

  db.on('query-error', (error, query) => {
    queryStartTimes.delete(query.__knexQueryUid);
    console.error('Query Error:', query.sql);
    console.error('Error:', error.message);
  });
}

export default db;
