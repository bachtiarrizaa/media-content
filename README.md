# Media Content Monitoring API

A backend service built with Node.js, TypeScript, and Express, backed by a PostgreSQL database using Knex.js. The service exposes endpoints for bulk ingesting, searching, and aggregating media and social post records ("mentions").

🚀 **Interactive API Documentation**: [Postman Documentation](https://documenter.getpostman.com/view/41956571/2sBYArTryY)

---

## 1. How to Run

You can run this project either using Docker Compose (recommended) or locally on your host machine.

### Option A: Running with Docker Compose (Recommended)

Make sure you have Docker installed and running on your system.

1. **Start the application and database** (in the background):
   ```bash
   docker compose up -d --build
   ```
2. **Run database migrations** inside the application container:
   ```bash
   docker compose exec app npm run migrate:up
   ```
3. **Seed the database** (Optional - loads the assessment seed data):
   ```bash
   curl -i -X POST http://localhost:8000/api/internal/mentions/bulk \
     -H "Content-Type: application/json" \
     -d @docs/seed_mentions.json
   ```
4. **Access the API**:
   - Healthcheck: `GET http://localhost:8000/`
   - Search: `GET http://localhost:8000/api/mentions`
   - Stats: `GET http://localhost:8000/api/mentions/stats`

To stop the containers, run:
```bash
docker compose down
```

---

### Option B: Running Locally (Host System)

#### Prerequisites
- Node.js (v20 or higher recommended)
- PostgreSQL running locally

1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Configure Environment Variables**:
   Copy `.env.example` to `.env` and fill in your database credentials:
   ```env
   PORT=8000
   NODE_ENV=development
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=media_content
   DB_USER=your_postgres_user
   DB_PASSWORD=your_postgres_password
   ```
   *(Ensure you have created the database specified in `DB_NAME` in your local PostgreSQL instance).*
3. **Run Database Migrations**:
   ```bash
   npm run migrate:up
   ```
4. **Run Unit Tests**:
   ```bash
   npm test
   ```
5. **Start the Development Server**:
   ```bash
   npm run dev
   ```

---

## 2. Database Schema Design

The table structure is implemented via Knex migrations inside `src/database/migrations/` as follows:

| Column Name | Data Type | Nullable | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | No (PK) | Globally unique identifier, generated using `gen_random_uuid()`. |
| `external_id` | `VARCHAR(255)` | Yes | Raw identifier provided by the source scraper (optional). |
| `source` | `VARCHAR(255)` | No | Normalized source name (e.g., "The Star", "Twitter") for dashboard filter consistency. |
| `source_raw` | `VARCHAR(255)` | Yes | Original unnormalized source string, kept for audit and debugging purposes. |
| `title` | `TEXT` | Yes | Title of the article/post. Nullable (e.g., social media posts without titles). |
| `content` | `TEXT` | Yes | HTML-stripped body content of the mention. |
| `url` | `TEXT` | No | Original URL of the post. |
| `normalized_url` | `TEXT` | No (Unique) | Cleaned URL used as the unique key for database-level deduplication. |
| `author` | `VARCHAR(255)` | Yes | Author of the post/article. |
| `published_at` | `TIMESTAMPTZ` | Yes | Timezone-aware timestamp of publication. Nullable for missing dates. |
| `engagement` | `INTEGER` | Yes | Standardized engagement count. |
| `created_at` | `TIMESTAMPTZ` | No | Timestamp when the record was created. |
| `updated_at` | `TIMESTAMPTZ` | No | Timestamp when the record was last updated. |

### Modeling & Data Type Justification
We deliberately chose specific database types to balance storage efficiency, data integrity, and scalability:

- **`TEXT` vs `VARCHAR(255)`**:
  - `VARCHAR(255)` is used for bounded fields such as `external_id`, `source`, `source_raw`, and `author` to prevent anomalous or malicious input from occupying excessive disk space, while offering ample length for names and identifiers.
  - `TEXT` is used for `title`, `content`, `url`, and `normalized_url` because web URLs and article contents have unpredictable, often very long lengths (e.g. URLs with tracking parameters can easily exceed 2,000 characters). Using `TEXT` prevents accidental data truncation.
- **`TIMESTAMPTZ` (Timezone-Aware Timestamp)**:
  - Storing dates using `TIMESTAMPTZ` ensures that all timestamps are standardized to UTC internally, regardless of the host server's local timezone. This prevents date-skew and guarantees consistent logic when performing date range checks (`from`/`to` parameters).
- **`INTEGER` vs `BIGINT` for Engagement**:
  - Standard `INTEGER` in PostgreSQL supports numbers up to `2.14` billion (`2,147,483,647`). Since individual social media post engagement (likes, retweets, views) practically never exceeds this number, `INTEGER` is chosen.
  - Using `INTEGER` (4 bytes) instead of `BIGINT` (8 bytes) saves 4 bytes of disk storage per row, optimizing memory cache allocation when performing heavy query indexes.

### Indexing Strategy
To ensure fast performance for query parameters:
1. **B-Tree Index (`idx_mentions_source`)**: Applied to `source` to speed up source-based filtering in GET `/mentions`.
2. **B-Tree Index (`idx_mentions_published_at`)**: Applied to `published_at` to speed up date range (`from`/`to`) queries.
3. **GIN Index (`idx_mentions_search`)**: Applied as a Full-Text Search index across `title` and `content` using `to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, ''))`. We use `coalesce` to safely handle null columns (e.g., social media posts without titles) so that they do not break index composition.

---

## 3. Duplicate Detection & Idempotency Rules

We define a **duplicate** as any mention sharing the same **`normalized_url`**. A URL represents a unique web resource, making it the most reliable identifier for deduplicating identical articles scraped from multiple channels.

### Normalization Logic:
We clean the URL in the application layer (`src/services/normalize.service.ts`):
1. Convert protocol and host to lowercase (e.g. `HTTPS://` to `https://`).
2. Strip query parameters (e.g., `?ref=fb` or tracker IDs) and hashes.
3. Strip trailing slashes `/` from the path (e.g., `/status/` to `/status`).

### Idempotency Execution:
1. **Service-Layer Deduplication**: If an ingested JSON batch contains multiple records sharing the same `normalized_url` (e.g., two entries for `str-99120` with different engagement scores), we filter them in a JavaScript `Map` first, keeping only the latest occurrence. This prevents PostgreSQL's `ON CONFLICT DO UPDATE command cannot affect row a second time` error when trying to write identical keys in the same transaction.
2. **Database-Level Upsert**: We execute Knex `.onConflict('normalized_url').merge(...)`. If a URL already exists in the database, Postgres updates the existing row with the latest metadata and engagement metrics, satisfying the idempotency requirement.
3. **Stat count using `xmax`**: We return `(xmax = 0) as is_inserted` inside the SQL upsert returning clause. In PostgreSQL, `xmax` tracks transaction locks and is `0` only for newly inserted rows, letting us accurately count inserted vs. updated rows in a single query.

---

## 4. Assumptions & Trade-offs

### Assumptions:
- **Unix Timestamps**: We assumed numerical values in the `published_at` field (e.g., `1786435200`) are in **seconds** (Unix epoch). Multiplying by 1,000 matches the correct target years (e.g., 2026).
- **Date Formats**: Local date strings containing slashes (`11/08/2026`) are parsed using `DD/MM/YYYY` conventions.
- **Engagement Parsing**: Engagement numbers represented as strings with commas (e.g., `"1,204"`) are cleaned of commas and parsed as standard integers.
- **HTML Sanitization**: We assumed analysts need clean text for keyword search, so all HTML tags are stripped. We used `sanitize-html` to prevent HTML injection attacks (such as the `<script>` tags found in `seed_mentions.json`).

### Trade-offs:
- **Flat Table Structure**: We chose to store the normalized source names directly in the `mentions` table rather than creating a normalized `sources` lookup table with foreign keys. While a normalized structure is cleaner DB-design, keeping a flat table avoids multiple joins during bulk inserts and retrieval, maximizing ingestion speed. We mitigated the lack of foreign key traceability by retaining `source_raw` directly for auditing.
- **Chunked Bulk Inserts**: Payloads are chunked in batches of `500` inside a single database transaction. This prevents hitting PostgreSQL's maximum binding limit of `65,535` parameters for very large batch imports, balancing speed and database reliability.

---

## 5. Development Time & Session Breakdown

- **Total Time Spent**: ~5 hours.
- **Session 1 (2 hours)**: Initial research, database schema design, and Knex migration setup (column mapping, timestamptz reasoning, and GIN FTS index implementation).
- **Session 2 (2 hours)**: Creating the repository, normalization service, validation schemas, Express controllers/routers, fixing PostgreSQL duplicate batch constraints, and writing unit tests.
- **Session 3 (1 hour)**: Codebase cleanup, implementing DTO types inferred from Zod schemas, integrating `ValidationUtils` and `ApiResponse`, implementing Search & Stats endpoints, Docker Compose setup, and organizing progressive step-by-step Git commits.

---

## 6. "With Another Week, I Would..."

If given more time, I would focus on:
1. **Dynamic Source Mapping Table**: Replace the hardcoded `SOURCE_MAP` config in the service with a database-backed table `source_mappings`. This would allow administrators to define new media normalization rules dynamically via a dashboard UI without redeploying code.
2. **Cursor-based (Keyset) Pagination**: Migrate from offset-based pagination (`LIMIT/OFFSET`) to cursor-based pagination (using `(published_at, id) < (last_published_at, last_id)`) to maintain `O(1)` query performance even when scanning millions of rows at deep pages.
3. **Redis Caching for Statistics**: Implement Redis caching with a short Time-To-Live (TTL) on the `/mentions/stats` endpoint, as dashboard charts are read-heavy but change slowly, reducing database CPU load.
4. **Asynchronous Ingestion with Message Queues**: Transition the bulk ingestion endpoint to an asynchronous architecture using a message queue (e.g., BullMQ or RabbitMQ). The API would immediately respond with `202 Accepted` after queuing the raw payload, offloading data parsing, normalization, and database upserts to a background worker to avoid HTTP timeouts.
5. **Observability & Structured Logging**: Set up structured JSON logging (using Winston/Morgan) and integrate OpenTelemetry for real-time monitoring of API response latency, slow SQL queries, and error rates.
6. **Integration Tests**: Set up `supertest` to test API route responses, status codes, and query-handling logic directly over HTTP.
7. **API Documentation**: Integrate Swagger / OpenAPI to auto-document endpoints and query filters.
