import { test, describe } from 'node:test';
import assert from 'node:assert';
import { NormalizeService } from '../services/normalize.service';

describe('NormalizeService tests', () => {
  describe('normalizeSource', () => {
    test('standardizes known aliases', () => {
      assert.strictEqual(NormalizeService.normalizeSource('thestar'), 'The Star');
      assert.strictEqual(NormalizeService.normalizeSource('nst'), 'New Straits Times');
    });

    test('standardizes unknown sources by capitalizing words', () => {
      assert.strictEqual(NormalizeService.normalizeSource('malaysiakini '), 'Malaysiakini');
      assert.strictEqual(NormalizeService.normalizeSource('twitter'), 'Twitter');
      assert.strictEqual(NormalizeService.normalizeSource('FACEBOOK'), 'Facebook');
    });

    test('cleans raw source string format', () => {
      assert.strictEqual(NormalizeService.normalizeSource('  nst++ '), 'New Straits Times');
    });
  });

  describe('stripHtml', () => {
    test('removes simple HTML tags', () => {
      const html = '<p>The ringgit opened higher against the greenback on Monday, buoyed by&nbsp;improved sentiment.</p>';
      const expected = 'The ringgit opened higher against the greenback on Monday, buoyed by improved sentiment.';
      assert.strictEqual(NormalizeService.stripHtml(html), expected);
    });

    test('completely strips dangerous tags like script', () => {
      const html = '<p>Flash floods hit parts of Klang Valley</p><script>alert(1)</script>';
      assert.strictEqual(NormalizeService.stripHtml(html), 'Flash floods hit parts of Klang Valley');
    });
  });

  describe('normalizeUrl', () => {
    test('removes trailing slashes', () => {
      const url = 'https://www.thestar.com.my/news/2026/08/15/tourism-arrivals-july/';
      const expected = 'https://www.thestar.com.my/news/2026/08/15/tourism-arrivals-july';
      assert.strictEqual(NormalizeService.normalizeUrl(url), expected);
    });

    test('removes query parameters for canonical url matching', () => {
      const url = 'https://twitter.com/klcommuter/status/8812340091?ref=src_page&utm=xyz';
      const expected = 'https://twitter.com/klcommuter/status/8812340091';
      assert.strictEqual(NormalizeService.normalizeUrl(url), expected);
    });

    test('lowercases hosts and protocols', () => {
      const url = 'HTTP://WWW.NST.COM.MY/News/Nation';
      assert.strictEqual(NormalizeService.normalizeUrl(url), 'http://www.nst.com.my/News/Nation');
    });
  });

  describe('parsePublishedAt', () => {
    test('handles unix timestamps (seconds)', () => {
      const result = NormalizeService.parsePublishedAt(1786435200); // 2026-08-11T08:00:00Z
      assert.ok(result instanceof Date);
      assert.strictEqual(result.toISOString(), '2026-08-11T08:00:00.000Z');
    });

    test('handles standard ISO formats', () => {
      const result = NormalizeService.parsePublishedAt('2026-08-10T08:15:00Z');
      assert.ok(result instanceof Date);
      assert.strictEqual(result.toISOString(), '2026-08-10T08:15:00.000Z');
    });

    test('handles yyyy-mm-dd hh:mm:ss format', () => {
      const result = NormalizeService.parsePublishedAt('2026-08-10 08:20:00');
      assert.ok(result instanceof Date);
      assert.strictEqual(result.toISOString(), '2026-08-10T08:20:00.000Z');
    });

    test('handles dd/mm/yyyy format in UTC', () => {
      const result = NormalizeService.parsePublishedAt('11/08/2026');
      assert.ok(result instanceof Date);
      assert.strictEqual(result.toISOString(), '2026-08-11T00:00:00.000Z');
    });

    test('returns null for missing or invalid dates', () => {
      assert.strictEqual(NormalizeService.parsePublishedAt(null), null);
      assert.strictEqual(NormalizeService.parsePublishedAt(undefined), null);
      assert.strictEqual(NormalizeService.parsePublishedAt('invalid-date'), null);
    });
  });

  describe('parseEngagement', () => {
    test('handles numeric inputs directly', () => {
      assert.strictEqual(NormalizeService.parseEngagement(412), 412);
    });

    test('parses strings containing commas', () => {
      assert.strictEqual(NormalizeService.parseEngagement('3,402'), 3402);
      assert.strictEqual(NormalizeService.parseEngagement('1,200,500'), 1200500);
    });

    test('returns null for missing or invalid inputs', () => {
      assert.strictEqual(NormalizeService.parseEngagement(null), null);
      assert.strictEqual(NormalizeService.parseEngagement('abc'), null);
    });
  });
});
