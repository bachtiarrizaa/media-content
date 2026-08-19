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

export type RawMentionInput = z.infer<typeof mentionSchema>;

export const bulkIngestSchema = z.array(mentionSchema).min(1, 'At least one mention is required');
export type BulkIngestDto = z.infer<typeof bulkIngestSchema>;
