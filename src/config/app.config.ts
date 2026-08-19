import type { AppConfig } from "../types/config";

export const appConfig: AppConfig = {
  port: Number(process.env.APP_PORT) || 3000,
  host: process.env.APP_HOST ?? "localhost",
  env: process.env.NODE_ENV ?? "development",
};
