import { describe, expect, it } from 'vitest';
import { compactDate, htmlToText, nonEmpty } from './text';

describe('nonEmpty', () => {
  it.each([
    [null, undefined],
    [undefined, undefined],
    ['   ', undefined],
    ['  value ', 'value'],
  ])('%j → %j', (input, expected) => {
    expect(nonEmpty(input)).toBe(expected);
  });
});

describe('htmlToText', () => {
  it('removes tags, decodes entities and collapses whitespace', () => {
    expect(htmlToText('<strong>Ouse Fen:</strong>\n the &amp; <a href="#">egret</a>')).toBe(
      'Ouse Fen: the & egret',
    );
  });

  it('does not execute embedded scripts', () => {
    expect(htmlToText('<img src=x onerror="window.xssProbe = true">safe')).toBe('safe');
    expect((window as { xssProbe?: boolean }).xssProbe).toBeUndefined();
  });

  it('returns undefined for empty input', () => {
    expect(htmlToText(undefined)).toBeUndefined();
    expect(htmlToText('<p> </p>')).toBeUndefined();
  });
});

describe('compactDate', () => {
  it('formats dates for the NYT API', () => {
    expect(compactDate('2026-10-01')).toBe('20261001');
    expect(compactDate(undefined)).toBeUndefined();
  });
});
