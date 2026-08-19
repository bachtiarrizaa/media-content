import type { Knex } from "knex";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "./.env") });

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing environment variable: ${key}`);
  return value;
}

const connection: Knex.PgConnectionConfig = {
  host: requireEnv("DB_HOST"),
  port: Number(requireEnv("DB_PORT")),
  database: requireEnv("DB_NAME"),
  user: requireEnv("DB_USER"),
  password: requireEnv("DB_PASSWORD"),
};

const config: Record<string, Knex.Config> = {
  development: {
    client: "pg",
    connection,
    migrations: {
      directory: path.resolve(__dirname, "./src/database/migrations"),
      extension: "ts",
    },
  },

  production: {
    client: "pg",
    connection,
    migrations: {
      directory: path.resolve(__dirname, "./database/migrations"),
    },
  },
};

export default config;