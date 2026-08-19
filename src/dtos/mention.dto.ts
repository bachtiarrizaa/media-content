import z from 'zod';
import { bulkIngestSchema, mentionSchema } from '../validations/mention.validation';

export type RawMentionDto = z.infer<typeof mentionSchema>;
export type BulkIngestDto = z.infer<typeof bulkIngestSchema>;
