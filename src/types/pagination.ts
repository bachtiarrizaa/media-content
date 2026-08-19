import { ParsedQs } from 'qs';

export type PaginationQuery = {
  page?: number;
  limit?: number;
};

export type QueryParams = ParsedQs;

export type PaginationParams = {
  page: number;
  limit: number;
  offset: number;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export type PaginatedResponse<T> = {
  success: boolean;
  message: string;
  data: T[];
  pagination: PaginationMeta;
};
