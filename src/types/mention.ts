export interface Mention {
  id: string;
  external_id: string | null;
  source: string;
  source_raw: string | null;
  title: string | null;
  content: string | null;
  url: string;
  normalized_url: string;
  author: string | null;
  published_at: Date | null;
  engagement: number | null;
  created_at: Date;
  updated_at: Date;
}