import { z } from 'zod';

export const mentionSchema = z.object({
  external_id: z.string().max(255).nullable().optional(),
  source: z.string().min(1, 'Source is required').max(255, 'Source must be under 255 characters'),
  title: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
  url: z.string().url('Must be a valid URL'),
  author: z.string().max(255).nullable().optional(),
  published_at: z.union([z.string(), z.number()]).nullable().optional(),
  engagement: z.union([z.number(), z.string()]).nullable().optional(),
});

export const bulkIngestSchema = z.array(mentionSchema).min(1, 'At least one mention is required');

export const searchQuerySchema = z.object({
  q: z.string().optional(),
  source: z.string().optional(),
  from: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid from date format' })
    .optional(),
  to: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid to date format' })
    .optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  sort_by: z.enum(['published_at', 'engagement', 'source', 'created_at']).optional(),
  sort_order: z.enum(['asc', 'desc']).optional(),
});

export const statsQuerySchema = z.object({
  group_by: z.enum(['source', 'day'], {
    message: 'group_by must be "source" or "day"',
  }),
});
