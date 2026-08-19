import sanitizeHtml from 'sanitize-html';
import { RawMentionInput } from '../validations/mention.validation';
import { Mention } from '../types/mention';

const SOURCE_ALIASES: Record<string, string> = {
  thestar: 'The Star',
  nst: 'New Straits Times',
};

export class NormalizeService {
  static normalizeSource(source: string): string {
    const cleaned = source.trim().replace(/\+/g, '');
    const key = cleaned.toLowerCase();

    if (SOURCE_ALIASES[key]) {
      return SOURCE_ALIASES[key];
    }

    return cleaned.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  }

  static stripHtml(html: string): string {
    return sanitizeHtml(html, {
      allowedTags: [],
      allowedAttributes: {},
    }).trim();
  }

  static normalizeUrl(urlString: string): string {
    try {
      const url = new URL(urlString.trim());

      const protocol = url.protocol.toLowerCase();
      const host = url.host.toLowerCase();

      let pathname = url.pathname;
      if (pathname.endsWith('/') && pathname.length > 1) {
        pathname = pathname.slice(0, -1);
      }

      return `${protocol}//${host}${pathname}`;
    } catch {
      return urlString.trim().toLowerCase();
    }
  }

  static parsePublishedAt(dateInput?: string | number | null): Date | null {
    if (!dateInput) return null;

    if (typeof dateInput === 'number') {
      return new Date(dateInput * 1000);
    }

    const trimmed = dateInput.trim();

    const dmyRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const dmyMatch = trimmed.match(dmyRegex);
    if (dmyMatch) {
      const [, day, month, year] = dmyMatch;
      return new Date(Date.UTC(parseInt(year!, 10), parseInt(month!, 10) - 1, parseInt(day!, 10)));
    }

    const spaceFormatRegex = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/;
    if (spaceFormatRegex.test(trimmed)) {
      return new Date(trimmed.replace(' ', 'T') + 'Z');
    }

    const parsedDate = new Date(trimmed);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate;
    }

    return null;
  }

  static parseEngagement(engagementInput?: number | string | null): number | null {
    if (engagementInput === undefined || engagementInput === null) return null;

    if (typeof engagementInput === 'number') {
      return engagementInput;
    }

    const cleaned = engagementInput.replace(/,/g, '').trim();
    const parsed = parseInt(cleaned, 10);

    return isNaN(parsed) ? null : parsed;
  }

  static normalize(input: RawMentionInput): Omit<Mention, 'id' | 'created_at' | 'updated_at'> {
    return {
      external_id: input.external_id ? input.external_id.trim() : null,
      source: this.normalizeSource(input.source),
      source_raw: input.source,
      title: input.title ? input.title.trim() : null,
      content: input.content ? this.stripHtml(input.content) : null,
      url: input.url.trim(),
      normalized_url: this.normalizeUrl(input.url),
      author: input.author ? input.author.trim() : null,
      published_at: this.parsePublishedAt(input.published_at),
      engagement: this.parseEngagement(input.engagement),
    };
  }
}
